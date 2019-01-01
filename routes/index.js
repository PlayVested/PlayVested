const express = require('express');
const passport = require('passport');
const router = express.Router({mergeParams: true});

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
    successRedirect: '/',
    failureRedirect: '/login',
}), (req, res) => {
    // nothing to actually do, user will be redirected on success or failure
});

router.get('/logout', (req, res) => {
    // this will trash the current session
    req.logout();

    req.flash(`success`, `Logged you out!`);

    // send them back to the home page
    res.redirect('/');
});

module.exports = router;