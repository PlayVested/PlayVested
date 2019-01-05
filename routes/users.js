const express = require('express');
const router = express.Router({mergeParams: true});

const { isLoggedIn } = require('../middleware/misc');
const Allocation = require('../models/allocation');
const Player = require('../models/player');
const Record = require('../models/record');

// 'index' route
// no reason to view all users on their own, redirect to home page
router.get('/', (req, res) => {
    res.redirect('/');
});

// 'new' route
router.get('/new', (req, res) => {
    res.redirect('/register');
});

// 'create' route
// this is called by games to create a new user
router.post('/', (req, res) => {
    console.error(`This isn't used`);
    res.redirect(`/`);
});

// 'show' route
router.get('/:userID', isLoggedIn, (req, res) => {
    if (req.user._id.equals(req.params.userID)) {
        Player.find({ownerID: req.user._id}, (playerErr, players) => {
            if (playerErr) {
                console.error(`Error: ${playerErr}`);
                res.redirect('back');
            } else {
                Record.find({playerID: players}).sort({createdAt: 'desc'}).populate('gameID').exec((recordErr, records) => {
                    if (recordErr) {
                        console.error(`Error: ${recordErr}`);
                        res.redirect('back');
                    } else {
                        Allocation.find({playerID: players}).populate('charityID').exec((allocationErr, foundAllocations) => {
                            if (allocationErr) {
                                console.error(`Error: ${allocationErr}`);
                                res.redirect('back');
                            } else {
                                // combine the allocations for all player associated with this user
                                // sum up the splits and then normalize the results
                                let allocations = [];
                                let allocDict = {};
                                let total = 0;
                                foundAllocations.forEach((alloc) => {
                                    if (!allocDict[alloc.charityID]) {
                                        allocDict[alloc.charityID] = {
                                            organizationName: alloc.charityID.organizationName,
                                            percentage: 0,
                                        };
                                    }

                                    allocDict[alloc.charityID].percentage += alloc.percentage;
                                    total += alloc.percentage;
                                });

                                // now smash the results back down to a simple array
                                Object.keys(allocDict).forEach((key) => {
                                    allocations.push({
                                        organizationName: allocDict[key].organizationName,
                                        percentage: Math.round(100.0 * allocDict[key].percentage / total),
                                    });
                                });

                                // sort alphabetically
                                allocations.sort((a, b) => {
                                    return (a.organizationName.localeCompare(b.organizationName));
                                });

                                return res.render('users/show', { records, allocations });
                            }
                        });
                    }
                });
            }
        });
    }
});

// 'edit' route
router.get('/:userID/edit', isLoggedIn, (req, res) => {
    if (req.user._id.equals(req.params.userID)) {
        return res.render('users/edit');
    }

    res.redirect('back');
});

// 'update' route
router.put('/:userID', isLoggedIn, (req, res) => {
    if (req.user._id.equals(req.params.userID)) {
        const { user } = res.locals;
        req.body.email = req.body.username;
        Object.assign(user, req.body.user);
        user.save();
        req.flash(`success`, `Updated user info`);
    } else {
        req.flash(`error`, `Failed to update user info`);
    }

    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:userID', isLoggedIn, (req, res) => {
    if (req.user._id.equals(req.params.userID)) {
        req.user.remove((err) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Failed to remove user: ${err.message}`);
            } else {
                req.flash(`success`, `User deleted`);
            }

            return res.redirect('/');
        });
    } else {
        req.flash(`error`, `Failed to get user`);
        return res.redirect('back');
    }
});

module.exports = router;
