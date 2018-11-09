const express = require('express');
const router = express.Router({mergeParams: true});

const isLoggedIn = require('../middleware/isLoggedIn');

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
router.post('/', (req, res) => {
    req.flash(`error`, `Error, use /register post route instead`);
    return res.redirect('back');
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
