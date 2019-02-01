const express = require('express');
const passport = require('passport');
const router = express.Router({mergeParams: true});

const Charity = require('../models/charity');
const Developer = require('../models/developer');
const Invitation = require('../models/invitation');
const User = require('../models/user');

// index route
router.get('/', (req, res) => {
    res.render('home');
});

// show signup form
router.get('/register', (req, res) => {
    res.render('register');
});

// handle signing up a new user
router.post('/register', (req, res) => {
    User.register(req.body.user, req.body.password, (err, newUser) => {
        if (err) {
            console.error(err);
            req.flash(`error`, `Failed to register user: ${err.message}`);
            return res.redirect('/register');
        }

        // new user has been created
        req.body.username = req.body.user.username;
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/register',
        })(req, res, () => {});
    });
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
}), (req, res) => {
    // cache the user just in case anything happens to the session while
    // this is processing in the background
    const user = req.user;

    // go ahead and start the process of moving to the home page
    // the rest of this can happen async in the background
    res.redirect('/');

    // check if they have any pending invitations
    Invitation.find({email: user.username}, (err, invitations) => {
        // just bail if we hit any errors
        // this is a non-critical feature
        // hopefully it will work next time they log in
        if (err) {
            console.error(`Failed to get invitations, skipping`);
            return;
        }

        invitations.forEach((invitation) => {
            console.log(`charity: ${invitation.charityID}`);
            if (invitation.charityID) {
                Charity.findById(invitation.charityID, (err, foundCharity) => {
                    if (err) {
                        req.flash(`error`, `Failed to get charity for invitation: ${err.message}`);
                    } else {
                        // add the current user to the list of owners
                        foundCharity.ownerID.push(user);
                        foundCharity.save();
                        req.flash(`success`, `You are now an owner of ${foundCharity.organizationName}`);

                        // invitation has been applied, go ahead and dump it
                        invitation.remove((err) => {
                            if (err) {
                                req.flash(`error`, `Failed to remove invitation: ${err.message}`);
                            }
                        });
                    }
                });
            } else if (invitation.devID) {
                Developer.findById(invitation.devID, (err, foundDeveloper) => {
                    if (err) {
                        req.flash(`error`, `Failed to get developer for invitation: ${err.message}`);
                    } else {
                        // add the current user to the list of owners
                        foundDeveloper.ownerID.push(user);
                        foundDeveloper.save();
                        req.flash(`success`, `You are now an owner of ${foundDeveloper.companyName}`);

                        // invitation has been applied, go ahead and dump it
                        invitation.remove((err) => {
                            if (err) {
                                req.flash(`error`, `Failed to remove invitation: ${err.message}`);
                            }
                        });
                    }
                });
            }
        });
    });
});

router.get('/logout', (req, res) => {
    // this will trash the current session
    req.logout();

    req.flash(`success`, `Logged you out!`);

    // send them back to the home page
    res.redirect('/');
});

module.exports = router;