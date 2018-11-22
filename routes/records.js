const express = require('express');
const router = express.Router({mergeParams: true});

const { canEditRecord } = require('../middleware/record');

const Record = require('../models/record');

// 'index' route
// router.get('/', (req, res) => {
//     res.render('records/index');
// });

// 'total' route
router.get('/total', (req, res) => {
    const searchParams = {
        userID: req.body.userID,
        gameID: req.body.gameID,
    };

    Record.find(searchParams, (err, foundRecords) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            res.status(400);
            res.send('Failed to create user');
            return;
        } else {
            // TODO: authenticate game
            // pull info about the user
            const reducer = (accumulator, currentValue) => accumulator + currentValue;
            const total = foundRecords.reduce(reducer);
            res.status(200);
            res.send(total);
            return;
        }
    });
});

// 'create' route
router.post('/', (req, res) => {
    // TODO: add authentication (user logged in or validated game)
    const newRecord = {
        userID: req.body.userID || res.locals.user._id,
        gameID: req.body.gameID,
        amountEarned: req.body.amountEarned,
    };

    if (!newRecord.user || !newRecord.gameID) {
        res.status(400);
        res.send('Invalid input data');
        return;
    }

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
                res.send('Success');
            }
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
        if (window.confirm(`This will permanently delete the record, are you sure?`)) {
            record.remove((err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove record: ${err.message}`);
                } else {
                    req.flash(`success`, `Record deleted`);
                }
            });
            return res.redirect('/records');
        } else {
            return res.redirect('back');
        }
    }
});

module.exports = router;
