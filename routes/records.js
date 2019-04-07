const express = require('express');
const router = express.Router({mergeParams: true});

const { canEditRecord } = require('../middleware/record');

const Game = require('../models/game');
const Record = require('../models/record');

function findRecords(req, res, searchParams) {
    Record.find(searchParams, (err, foundRecords) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            res.status(400);
            res.send('Error running query');
            return;
        }

        // support filtering out by date
        let totals = {
            lifetime: 0,
        };

        var filteredDate = new Date();
        if (req.query.previousDays || req.query.previousWeeks || req.query.previousMonths) {
            totals.filtered = 0;
            if (req.query.previousDays) {
                filteredDate.setDate(filteredDate.getDate() - req.query.previousDays);
            } else if (req.query.previousWeeks) {
                filteredDate.setDate(filteredDate.getDate() - req.query.previousWeeks * 7);
            } else if (req.query.previousMonths) {
                filteredDate.setMonth(filteredDate.getMonth() - req.query.previousMonths);
            }
        }

        foundRecords.forEach((record) => {
            totals.lifetime += record.amountEarned;
            if (record.createdAt >= filteredDate) {
                totals.filtered += record.amountEarned;
            }
        });

        res.status(200);
        res.send(totals);
        return;
    });
}

// 'total' route
router.get('/total', (req, res) => {
    // this can be called for a player and/or game
    let searchParams = {};
    if (req.query.playerID) {
        searchParams.playerID = req.query.playerID;
    }
    if (req.query.gameID) {
        searchParams.gameID = req.query.gameID;
    }

    // make sure something was specified
    if (Object.keys(searchParams).length === 0) {
        res.status(400);
        res.send(`Player or game is required`);
        return;
    }

    // if there is a game specified, then make sure it is owned by the dev
    if (searchParams.gameID) {
        Game.find({_id: searchParams.gameID, devID: req.query.devID}, (err, foundGames) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                res.status(400);
                return res.send('Error finding game');
            } else if (!foundGames.length) {
                res.status(400);
                return res.send('Game is not owned by the specified developer');
            }

            return findRecords(req, res, searchParams);
        });
    } else {
        return findRecords(req, res, searchParams);
    }
});

// 'create' route
router.post('/', (req, res) => {
    // TODO: add authentication (validated game and player)
    const newRecord = {
        playerID: req.body.playerID,
        gameID: req.body.gameID,
        amountEarned: Math.floor(req.body.amountEarned * 100) / 100,
    };

    if (!newRecord.playerID || !newRecord.gameID) {
        res.status(400);
        res.send('Invalid input data');
        return;
    }

    Game.find({devID: req.body.devID, _id: req.body.gameID}, (gameErr, foundGame) => {
        if (gameErr) {
            console.error(`Error: ${gameErr.message}`);
            res.status(400);
            res.send(`Error: ${gameErr.message}`);
        } else if (!foundGame) {
            console.error(`Game not found`);
            res.status(404);
            res.send(`Game not found`);
        } else {
            Record.create(newRecord, (err, createdRecord) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Error creating record: ${err.message}`);
                } else {
                    console.log('Created: ' + createdRecord);
                    if (req.isAuthenticated()) {
                        req.flash(`success`, `Successfully created record!`);
                        res.redirect(`/records/${createdRecord._id}`);
                    } else {
                        res.status(200);
                        res.send({
                            amountEarned: createdRecord.amountEarned,
                            status: 'Success',
                        });
                    }
                }
            });
        }
    });
});

// 'show' route
router.get('/:recordID', canEditRecord, (req, res) => {
    return res.render('records/show');
});

// 'edit' route
router.get('/:recordID/edit', canEditRecord, (req, res) => {
    return res.render('records/edit');
});

// 'update' route
router.put('/:recordID', canEditRecord, (req, res) => {
    const { record } = res.locals;
    if (record) {
        Object.assign(record, req.body.record);
        record.save();
        req.flash(`success`, `Updated record info`);
        res.redirect(`/records/${record._id}`);
    } else {
        req.flash(`error`, `Failed to update record info`);
    }

    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:recordID', canEditRecord, (req, res) => {
    const { record } = res.locals;
    if (record) {
        record.remove((err) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Failed to remove record: ${err.message}`);
            } else {
                req.flash(`success`, `Record deleted`);
            }

            return res.redirect('back');
        });
    } else {
        req.flash(`error`, `Failed to get record`);
        return res.redirect('back');
    }
});

module.exports = router;
