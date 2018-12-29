const express = require('express');
const router = express.Router({mergeParams: true});

const { userOwnsPlayer } = require('../middleware/user');

const Charity = require('../models/charity');
const Donation = require('../models/donation');
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

                // finally, create the donation info and link it to the player
                const newDonation = {
                    playerID: createdPlayer._id,
                    charityID: foundCharity._id,
                    percentage: 100,
                };

                Donation.create(newDonation, (err, createdDonation) => {
                    if (err) {
                        console.error(`Error: ${err.message}`);
                        res.status(400);
                        res.send('Failed to create donation');
                        return;
                    }
                    console.log('Created Donation: ' + createdDonation);

                    res.status(200);
                    res.send(String(createdPlayer._id));
                });
            });
        });
    });
});

// 'link' route
router.post('/link', (req, res) => {
    const userID = (req.params.user || {})._id;
    const playerID = (req.params.player || {})._id;
    if (userID === null || playerID === null) {
        res.status(400);
        res.send('user and player IDs are both required');
    }

    User.findById(userID, (errUser, foundUser) => {
        if (errUser) {
            Console.err(`Failed to find user: ${errUser}`);
            res.status(404);
            res.send('User not found');
        }

        Player.findById(playerID, (errPlayer, foundPlayer) => {
            if (errUser) {
                Console.err(`Failed to find player: ${errPlayer}`);
                res.status(404);
                res.send('Player not found');
            }

            // Make sure the player isn't already associated with another user
            User.find({players: playerID}, (errDupe, foundDupe) => {
                if (errDupe) {
                    Console.err(`Failed on dupe serach: ${errDupe}`);
                    res.status(404);
                    res.send('Error testing for duplicate users');
                } else if (foundDupe) {
                    if (foundDupe._id.equals(userID)) {
                        res.status(200);
                        res.send('User already associated with that player');
                    } else {
                        res.status(409);
                        res.send('Player is already owned by another user');
                    }
                } else {
                    foundUser.players.push(foundPlayer._id)
                    foundUser.save();

                    res.status(200);
                    res.send('Success');
                }
            });
        });
    });
});

// 'show' route
router.get('/:playerID', userOwnsPlayer, (req, res) => {
    res.render('players/show');
});

// 'edit' route
router.get('/:playerID/edit', userOwnsPlayer, (req, res) => {
    return res.render('players/edit');
});

// 'update' route
router.put('/:playerID', userOwnsPlayer, (req, res) => {
    const { player } = res.locals;
    Object.assign(player, req.body.player);
    player.save();
    req.flash(`success`, `Updated player info`);
    res.redirect(`/`);
});

// 'delete' route
router.delete('/:playerID', userOwnsPlayer, (req, res) => {
    Player.findByIdAndDelete(req.body.playerID, (err, deletedPlayer) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Failed to delete player: ${err.message}`);
        } else {
            req.flash(`success`, `Player deleted`);
            res.status(200);
            res.send(`Success`);
        }
    });
});

module.exports = router;
