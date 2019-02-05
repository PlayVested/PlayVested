const express = require('express');
const router = express.Router({mergeParams: true});

const { cacheDeveloper, canEditDeveloper } = require('../middleware/developer');
const { isLoggedIn, isOwner } = require('../middleware/misc');

const Developer = require('../models/developer');
const Game = require('../models/game');

// 'index' route
router.get('/', (req, res) => {
    Developer.find({}, (err, developers) => {
        if (err) {
            console.error(`Error getting developers: ${err.message}`);
            res.redirect('/');
        } else {
            res.render('developers/index', { developers });
        }
    });
});

// games 'index' route
router.get('/:developerID/games', cacheDeveloper, (req, res) => {
    Game.find({ devID: req.params.developerID }, (err, games) => {
        if (err) {
            console.error(`Error getting games: ${err.message}`);
            res.redirect('/');
        } else {
            res.render('games/index', { games });
        }
    });
});

// 'new' route
router.get('/new', isLoggedIn, (req, res) => {
    res.render('developers/new');
});

// 'create' route
router.post('/', isLoggedIn, (req, res) => {
    req.body.developer.ownerID = [req.user._id];
    Developer.create(req.body.developer, (err, createdDeveloper) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating developer: ${err.message}`);
            res.redirect(`back`);
        } else {
            console.log('Created: ' + createdDeveloper);
            req.flash(`success`, `Successfully created developer!`);
            res.redirect(`/developers/${createdDeveloper._id}`);
        }
    });
});

// 'show' route
router.get('/:developerID', cacheDeveloper, (req, res) => {
    return res.render('developers/show', { isOwner: isOwner(req.user, res.locals.developer) });
});

// 'edit' route
router.get('/:developerID/edit', canEditDeveloper, (req, res) => {
    Developer.find({}, (err, developers) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error editing developer: ${err.message}`);
            res.redirect(`back`);
        } else {
            res.render('developers/edit', { developers });
        }
    });
});

// 'update' route
router.put('/:developerID', canEditDeveloper, (req, res) => {
    const { developer } = res.locals;
    if (developer) {
        Object.assign(developer, req.body.developer);
        developer.save();
        req.flash(`success`, `Updated developer info`);
        return res.redirect(`/developers/${developer._id}`);
    }

    req.flash(`error`, `Failed to update developer info`);
    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:developerID', canEditDeveloper, (req, res) => {
    const { developer } = res.locals;
    if (developer) {
        developer.remove((err) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Failed to remove developer: ${err.message}`);
            } else {
                req.flash(`success`, `Developer deleted`);
            }

            return res.redirect('/developers');
        });
    } else {
        req.flash(`error`, `Failed to get developer`);
        return res.redirect('back');
    }
});

// 'delete owner' route
router.delete('/:developerID/owner/:ownerID', canEditDeveloper, (req, res) => {
    const {developer} = res.locals;
    if (developer) {
        const {ownerID} = req.params;
        for (let i = 0; i < developer.ownerID.length; i++) {
            if (developer.ownerID[i]._id.equals(ownerID)) {
                developer.ownerID.splice(i, 1);
                developer.save();
            }
        }
    }

    res.redirect('back');
});

module.exports = router;
