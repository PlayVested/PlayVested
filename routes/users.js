const express = require('express');
const passport = require('passport');
const router = express.Router({mergeParams: true});

const { isLoggedIn } = require('../middleware/misc');
const Allocation = require('../models/allocation');
const Charity = require('../models/charity');
const Invitation = require('../models/invitation');
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
                        Allocation.find({'playerID': req.user.defaultPlayer}).populate('charityID').exec((allocationErr, allocations) => {
                            if (allocationErr) {
                                console.error(`Error: ${allocationErr}`);
                                res.redirect('back');
                            } else {
                                // sort alphabetically
                                allocations.sort((a, b) => {
                                    return (a.charityID.organizationName.localeCompare(b.charityID.organizationName));
                                });

                                // track which charities they are already donating to
                                const existingCharityIDs = allocations.map(alloc => alloc.charityID._id);
                                Charity.find({_id: {$nin: existingCharityIDs}}, (charityErr, charities) => {
                                    if (charityErr) {
                                        console.error(`Error: ${charityErr}`);
                                        res.redirect('back');
                                    } else {
                                        return res.render('users/show', {records, allocations, charities});
                                    }
                                });
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
        return res.render('users/edit', {oldPassword: req.query.oldPassword});
    }

    res.redirect('back');
});

function errorToString(err) {
    return (err ? err.message : 'UNKNONWN');
}

function setPassword(foundUser, newPassword) {
    return new Promise((resolve, reject) => {
        return foundUser.setPassword(newPassword).then(() => {
            return resolve();
        }).catch((err) => {
            return reject(Error(`Error setting password: ${errorToString(err)}`));
        });
    });
}

function localAuth(req, res) {
    return new Promise((resolve, reject) => {
        passport.authenticate('local', (err, foundUser) => {
            if (err) {
                return reject(Error(`Error authenticating: ${errorToString(err)}`));
            } else if (!foundUser) {
                return reject(Error(`Old password is incorrect`));
            } else {
                return resolve(foundUser);
            }
        })(req, res);
    });
}

// 'update' route
router.put('/:userID', isLoggedIn, async (req, res) => {
    if (req.user._id.equals(req.params.userID)) {
        const { user } = res.locals;

        req.body.user.email = req.body.user.username;
        Object.assign(user, req.body.user);

        try {
            if (req.body.oldPassword) {
                if (req.body.confirmPassword && req.body.confirmPassword === req.body.password) {
                    req.body.username = req.body.user.username;
                    req.body.password = req.body.oldPassword;
                    const foundUser = await localAuth(req, res);
                    if (!foundUser._id.equals(user._id)) {
                        throw Error(`User doesn't match`);
                    }

                    await setPassword(user, req.body.confirmPassword);
                    user.flags.resetPassword = false;
                } else {
                    throw Error(`Passwords don't match`);
                }
            }

            user.save();
            req.flash(`success`, `Updated user info`);
            return res.redirect('/');
        } catch (err) {
            req.flash(`error`, `Failed to update the password: ${errorToString(err)}`);
        }
    } else {
        req.flash(`error`, `User info doesn't match logged in account`);
    }

    return res.redirect('back');
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
