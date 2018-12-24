const express = require('express');
const router = express.Router({mergeParams: true});
const passport = require('passport');

const isLoggedIn = require('../middleware/isLoggedIn');

const Charity = require('../models/charity');
const Donation = require('../models/donation');
const Game = require('../models/game');
const User = require('../models/user');

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
    // TODO: add authentication
    if (req.isAuthenticated()) {
        req.flash(`error`, `Error, use /register post route instead`);
        return res.redirect('back');
    }

    // make sure the request is coming from a verified game
    Game.findById(req.body.gameID, (err, foundGame) => {
        if (err || !foundGame) {
            console.warn(`Warning, game not found`);
            res.status(400);
            res.send('Invalid game ID');
            return;
        }

        // next make sure the charity they want to support exists
        console.log(`Looking for ${req.body.charityID}`);
        Charity.findById(req.body.charityID, (err, foundCharity) => {
            if (err || !foundCharity) {
                console.error(`Error: ${err.message}`);
                res.status(400);
                res.send('Failed to find the charity');
                return;
            } else {
                console.log(`Found Charity: ${foundCharity}`);

                // everything looks good, go ahead and create a new user
                const newUser = {
                    username: req.body.username,
                    email: req.body.email,
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    friends: [],
                };

                User.create(newUser, (err, createdUser) => {
                    if (err) {
                        console.error(`Error: ${err.message}`);
                        res.status(400);
                        res.send('Failed to create user');
                        return;
                    } else {
                        console.log('Created User: ' + createdUser);

                        // finally, create the donation info and link it to the user
                        const newDonation = {
                            userID: createdUser._id,
                            charityID: foundCharity._id,
                            percentage: 100,
                        };

                        Donation.create(newDonation, (err, createdDonation) => {
                            if (err) {
                                console.error(`Error: ${err.message}`);
                                res.status(400);
                                res.send('Failed to create donation');
                                return;
                            } else {
                                console.log('Created Donation: ' + createdDonation);
                                res.status(200);
                                res.send(String(createdUser._id));
                            }
                        });
                    }
                });
            }
        });
    });
});

// 'link' route
router.post('/link', passport.authenticate('local', {}), (req, res) => {
    // all we really want is the ID
    const userID = (req.user || {})._id;

    // we don't want to leave the logged in
    req.logout();

    return userID;
});

// 'show' route
router.get('/:userID', isLoggedIn, (req, res) => {
    if (req.user._id.equals(req.params.userID)) {
        return res.render('users/show');
    }

    res.redirect('back');
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
        if (window.confirm(`This will permanently delete your account, are you sure?`)) {
            req.user.remove((err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove user: ${err.message}`);
                } else {
                    req.flash(`success`, `User deleted`);
                }
            });
        } else {
            res.redirect(`back`);
        }
    }
});

module.exports = router;
