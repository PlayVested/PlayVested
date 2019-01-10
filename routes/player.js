const express = require('express');
const passport = require('passport');
const router = express.Router({mergeParams: true});

const { cachePlayer, canEditPlayer } = require('../middleware/player');

const Charity = require('../models/charity');
const Allocation = require('../models/allocation');
const Game = require('../models/game');
const Player = require('../models/player');

// 'index' route
// no reason to view all players on their own, redirect to home page
router.get('/', (req, res) => {
    res.redirect('/');
});

// 'new' route
router.get('/new', (req, res) => {
    res.redirect('/');
});

// 'create' route
// this is called by games to create a new player
router.post('/', (req, res) => {
    // TODO: add authentication
    if (req.isAuthenticated()) {
        req.flash(`error`, `Error, this should only be called by a connected game`);
        return res.redirect('back');
    }

    // make sure the request is coming from a verified game
    console.log(`Looking for game: ${req.body.gameID}`);
    Game.findById(req.body.gameID, (err, foundGame) => {
        if (err || !foundGame) {
            console.warn(`Warning, game not found`);
            res.status(400);
            res.send('Invalid game ID');
            return;
        }
        console.log(`Found Game: ${foundGame}`);

        // next make sure the charity they want to support exists
        console.log(`Looking for charity: ${req.body.charityID}`);
        Charity.findById(req.body.charityID, (err, foundCharity) => {
            if (err || !foundCharity) {
                console.error(`Warning, charity not found`);
                res.status(400);
                res.send('Failed to find the charity');
                return;
            }
            console.log(`Found Charity: ${foundCharity}`);

            // everything looks good, go ahead and create a new player
            const newPlayer = {
                gameID: foundGame._id,
            };

            Player.create(newPlayer, (err, createdPlayer) => {
                if (err) {
                    console.error(`Failed to create player\nError: ${err.message}`);
                    res.status(400);
                    res.send('Failed to create player');
                    return;
                }
                console.log('Created Player: ' + createdPlayer);

                // finally, create the allocation info and link it to the player
                const newAllocation = {
                    playerID: createdPlayer._id,
                    charityID: foundCharity._id,
                    percentage: 100,
                };

                Allocation.create(newAllocation, (err, createdAllocation) => {
                    if (err) {
                        console.error(`Error: ${err.message}`);
                        res.status(400);
                        res.send('Failed to create allocation');
                        return;
                    }
                    console.log('Created Allocation: ' + createdAllocation);

                    res.status(200);
                    res.send(String(createdPlayer._id));
                });
            });
        });
    });
});

// 'link' route
router.post('/:playerID/link', passport.authenticate('local'), (req, res) => {
    // we don't want to leave them logged in on accident
    // so just store the user ID and log them out now
    const userID = req.user._id;
    req.logout();

    const playerID = req.params.playerID;
    Player.findById(playerID, (errPlayer, foundPlayer) => {
        if (errPlayer) {
            Console.err(`Failed to find player: ${errPlayer}`);
            res.status(404);
            return res.send('Player not found');
        }

        // Make sure the player isn't already associated with another user
        if (foundPlayer.ownerID) {
            if (foundPlayer.ownerID.equals(userID)) {
                res.status(200);
                return res.send('User already associated with that player');
            }

            res.status(409);
            return res.send('Player is already owned by another user');
        } else {
            foundPlayer.ownerID = userID;
            foundPlayer.save();

            res.status(200);
            return res.send('Success!');
        }
    });
});

// 'show' route
router.get('/:playerID', canEditPlayer, (req, res) => {
    res.render('players/show');
});

// determine if the player has a linked user account
router.get('/:playerID/is-linked', cachePlayer, (req, res) => {
    const { player } = res.locals;
    if (player) {
        res.status(200);
        return res.send(!!player.ownerID);
    }

    res.status(404);
    res.send(false);
});

// 'edit' route
router.get('/:playerID/edit', canEditPlayer, (req, res) => {
    return res.render('players/edit');
});

// 'update' route
router.put('/:playerID', canEditPlayer, (req, res) => {
    const { player } = res.locals;
    Object.assign(player, req.body.player);
    player.save();
    req.flash(`success`, `Updated player info`);
    res.redirect(`/players/${player._id}`);
});

// 'delete' route
router.delete('/:playerID', canEditPlayer, (req, res) => {
    const { player } = res.locals;
    if (player) {
        player.remove((err) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Failed to delete player: ${err.message}`);
            } else {
                req.flash(`success`, `Player deleted`);
            }

            return res.redirect('back');
        });
    } else {
        req.flash(`error`, `Failed to get player`);
        return res.redirect('back');
    }
});

module.exports = router;
