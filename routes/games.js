const express = require('express');
const router = express.Router({mergeParams: true});

const { canEditGame } = require('../middleware/game');

const Game = require('../models/game');

// 'index' route
router.get('/', (req, res) => {
    Game.find({}, (err, games) => {
        if (err) {
            console.error(`Error getting games: ${err.message}`);
            res.redirect('/');
        } else {
            res.render('games/index', { games });
        }
    });
});

// 'new' route
router.get('/new', (req, res) => {
    res.render('games/new');
});

// 'create' route
router.post('/', (req, res) => {
    const newGame = {
        companyName: req.body.companyName,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipcode: req.body.zipcode,
        ownerID: res.locals.user._id,
    };

    Game.create(newGame, (err, createdGame) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating game: ${err.message}`);
        } else {
            console.log('Created: ' + createdGame);
            req.flash(`success`, `Successfully created game!`);
            res.redirect(`/games/${createdGame._id}`);
        }
    });
});

// 'show' route
router.get('/:gameID', canEditGame, (req, res) => {
    return res.render('games/show');
});

// 'edit' route
router.get('/:gameID/edit', canEditGame, (req, res) => {
    return res.render('games/edit');
});

// 'update' route
router.put('/:gameID', canEditGame, (req, res) => {
    const { game } = res.locals;
    if (game) {
        Object.assign(game, req.body.game);
        game.save();
        req.flash(`success`, `Updated game info`);
        res.redirect(`/games/${game._id}`);
    } else {
        req.flash(`error`, `Failed to update game info`);
    }

    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:gameID', canEditGame, (req, res) => {
    const { game } = res.locals;
    if (game) {
        if (window.confirm(`This will permanently delete the game, are you sure?`)) {
            game.remove((err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove game: ${err.message}`);
                } else {
                    req.flash(`success`, `Game deleted`);
                }
            });
            return res.redirect('/games');
        } else {
            return res.redirect('back');
        }
    }
});

module.exports = router;
