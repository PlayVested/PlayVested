const express = require('express');
const router = express.Router({mergeParams: true});

const { cacheGame, canEditGame } = require('../middleware/game');
const { isLoggedIn, isOwner } = require('../middleware/misc');

const Developer = require('../models/developer');
const Game = require('../models/game');

// 'new' route
router.get('/new', isLoggedIn, (req, res) => {
    Developer.find({ ownerID: req.user._id }, (err, developers) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error finding developers: ${err.message}`);
            res.redirect(`back`);
        } else {
            const selectedID = req.query.developerID;
            res.render('games/new', { developers, selectedID });
        }
    });
});

// 'create' route
router.post('/', isLoggedIn, (req, res) => {
    Game.create(req.body.game, (err, createdGame) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating game: ${err.message}`);
            res.redirect(`back`);
        } else {
            console.log('Created: ' + createdGame);
            req.flash(`success`, `Successfully created game!`);
            res.redirect(`/games/${createdGame._id}`);
        }
    });
});

// 'show' route
router.get('/:gameID', cacheGame, (req, res) => {
    Developer.findById(res.locals.game.devID, (err, developer) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error getting developer: ${err.message}`);
            res.redirect(`back`);
        } else {
            res.render('games/show', { developer, isOwner: isOwner(req.user, developer) });
        }
    });
});

// 'edit' route
router.get('/:gameID/edit', canEditGame, (req, res) => {
    Developer.find({ ownerID: req.user._id }, (err, developers) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error editing game: ${err.message}`);
            res.redirect(`back`);
        } else {
            res.render('games/edit', { developers });
        }
    });
});

// 'update' route
router.put('/:gameID', canEditGame, (req, res) => {
    const { game } = res.locals;
    if (game) {
        Object.assign(game, req.body.game);
        game.save();
        req.flash(`success`, `Updated game info`);
        res.redirect(`/games/${game._id}`);
        return res.redirect(`/games/${game._id}`);
    }

    req.flash(`error`, `Failed to update game info`);
    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:gameID', canEditGame, (req, res) => {
    const { game } = res.locals;
    if (game) {
        game.remove((err) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Failed to remove game: ${err.message}`);
            } else {
                req.flash(`success`, `Game deleted`);
            }

            return res.redirect('/games');
        });
    }
});

module.exports = router;
