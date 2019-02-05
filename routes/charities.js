const express = require('express');
const router = express.Router({mergeParams: true});

const { cacheCharity, canEditCharity } = require('../middleware/charity');
const { isLoggedIn, isOwner } = require('../middleware/misc');

const Charity = require('../models/charity');

// 'index' route
router.get('/', (req, res) => {
    Charity.find({}, (err, charities) => {
        if (err) {
            console.error(`Error getting charities: ${err.message}`);
            res.redirect('/');
        } else {
            res.render('charities/index', {charities});
        }
    });
});

// 'new' route
router.get('/new', isLoggedIn, (req, res) => {
    res.render('charities/new');
});

// 'create' route
router.post('/', isLoggedIn, (req, res) => {
    req.body.charity.ownerID = [ req.user._id ];
    Charity.create(req.body.charity, (err, createdCharity) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating charity: ${err.message}`);
            res.redirect('back');
        } else {
            console.log('Created: ' + createdCharity);
            req.flash(`success`, `Successfully created charity!`);
            res.redirect(`/charities/${createdCharity._id}`);
        }
    });
});

// 'show' route
router.get('/:charityID', cacheCharity, (req, res) => {
    return res.render('charities/show', { isOwner: isOwner(req.user, res.locals.charity) });
});

// 'edit' route
router.get('/:charityID/edit', canEditCharity, (req, res) => {
    return res.render('charities/edit');
});

// 'update' route
router.put('/:charityID', canEditCharity, (req, res) => {
    const { charity } = res.locals;
    if (charity) {
        Object.assign(charity, req.body.charity);
        charity.save();
        req.flash(`success`, `Updated charity info`);
        return res.redirect(`/charities/${charity._id}`);
    }

    req.flash(`error`, `Failed to update charity info`);
    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:charityID', canEditCharity, (req, res) => {
    const { charity } = res.locals;
    if (charity) {
        charity.remove((err) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Failed to remove charity: ${err.message}`);
            } else {
                req.flash(`success`, `Charity deleted`);
            }

            return res.redirect('/charities');
        });
    } else {
        req.flash(`error`, `Failed to get charity`);
        return res.redirect('back');
    }
});

// 'delete owner' route
router.delete('/:charityID/owner/:ownerID', canEditCharity, (req, res) => {
    const {charity} = res.locals;
    if (charity) {
        const {ownerID} = req.params;
        for (let i = 0; i < charity.ownerID.length; i++) {
            if (charity.ownerID[i]._id.equals(ownerID)) {
                charity.ownerID.splice(i, 1);
                charity.save();
            }
        }
    }

    res.redirect('back');
});

module.exports = router;
