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
        Charity.find({name: req.body.charityName}, (err, foundCharities) => {
            if (err || !foundCharities || foundCharities.length !== 1) {
                console.error(`Warning, charity not found`);
                res.status(400);
                res.send('Failed to find the charity');
                return;
            }
            const foundCharity = foundCharities[0];
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

function linkPlayerToUser(res, errPlayer, foundPlayer, userID, defaultPlayer) {
    if (errPlayer) {
        console.error(`Error while finding player: ${errPlayer}`);
        res.status(404);
        return res.send('Error while trying to find player');
    } else if (!foundPlayer) {
        console.error(`Failed to find player`);
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

        // transfer allocations over to the default player for this user
        Allocation.find({'playerID': [foundPlayer, defaultPlayer]}, (errAlloc, foundAllocations) => {
            if (errAlloc) {
                console.error(`Failed to find allocations: ${errAlloc}`);
                res.status(404);
                return res.send('Player not found');
            }

            let existingAllocs = {};
            let newAllocs = {};
            let total = 0;
            foundAllocations.forEach((alloc) => {
                // split them into new and existing allocations
                if (alloc.playerID.equals(defaultPlayer._id)) {
                    existingAllocs[alloc.charityID] = alloc;
                } else {
                    newAllocs[alloc.charityID] = alloc;
                }

                // keep track of the total so we can re-normalize
                total += alloc.percentage;
            });

            if (Object.keys(newAllocs).length) {
                Object.keys(newAllocs).forEach((charityID) => {
                    if (existingAllocs[charityID]) {
                        // combine them if they exist in both
                        existingAllocs[charityID].percentage += newAllocs[charityID].percentage;

                        // at this point we don't need the old allocation, go ahead and remove it
                        newAllocs[charityID].remove();
                    } else {
                        // copy over the new allocation and reassign to the default player associated with the active user
                        existingAllocs[charityID] = newAllocs[charityID];
                        existingAllocs[charityID].playerID = defaultPlayer;
                    }
                });

                // re-normalize the split between charities
                Object.keys(existingAllocs).forEach((charityID) => {
                    const pct = existingAllocs[charityID].percentage;
                    existingAllocs[charityID].percentage = Math.round(100.0 * pct / total);
                    existingAllocs[charityID].save();
                });
            }

            res.status(200);
            return res.send(String(foundPlayer._id));
        });
    }
}

// 'link' routes
router.post('/link/:playerID', passport.authenticate('local'), (req, res) => {
    // we don't want to leave them logged in on accident
    // so just store the user ID and log them out now
    const userID = req.user._id;
    const defaultPlayer = req.user.defaultPlayer;
    req.logout();

    Player.findById(req.params.playerID, (errPlayer, foundPlayer) => {
        return linkPlayerToUser(res, errPlayer, foundPlayer, userID, defaultPlayer);
    });
});

router.post('/link/game/:gameID', passport.authenticate('local'), (req, res) => {
    // we don't want to leave them logged in on accident
    // so just store the user ID and log them out now
    const userID = req.user._id;
    const defaultPlayer = req.user.defaultPlayer;
    req.logout();

    // this version is used when a player hasn't been created yet
    // first we create a new player, then link it to the active user
    Game.findById(req.params.gameID, (errGame, foundGame) => {
        if (errGame) {
            console.error(`Failed to find game: ${errGame}`);
            res.status(404);
            return res.send('Game not found');
        }

        const newPlayer = {
            gameID: foundGame._id,
        };

        Player.create(newPlayer, (errPlayer, createdPlayer) => {
            return linkPlayerToUser(res, errPlayer, createdPlayer, userID, defaultPlayer);
        });
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
