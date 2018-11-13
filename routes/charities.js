const express = require('express');
const router = express.Router({mergeParams: true});

const { canEditCharity } = require('../middleware/charity');

const Charity = require('../models/charity');

// 'index' route
router.get('/', (req, res) => {
    res.render('charities/index');
});

// 'new' route
router.get('/new', (req, res) => {
    res.render('charities/new');
});

// 'create' route
router.post('/', (req, res) => {
    const newCharity = {
        organizationName: req.body.name,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipcode: req.body.zipcode,
        taxID: req.body.taxID,
        ownerID: res.locals.user._id,
    };

    Charity.create(newCharity, (err, createdCharity) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating charity: ${err.message}`);
        } else {
            console.log('Created: ' + createdCharity);
            req.flash(`success`, `Successfully created charity!`);
            res.redirect(`/charities/${createdCharity._id}`);
        }
    });
});

// 'show' route
router.get('/:charityID', (req, res) => {
    if (req.user._id.equals(req.params.charityID)) {
        return res.render('charities/show');
    }

    res.redirect('back');
});

// 'edit' route
router.get('/:charityID/edit', canEditCharity, (req, res) => {
    if (req.charity._id.equals(req.params.charityID)) {
        return res.render('charities/edit');
    }

    res.redirect('back');
});

// 'update' route
router.put('/:charityID', canEditCharity, (req, res) => {
    const { charity } = res.locals;
    if (charity) {
        Object.assign(charity, req.body.charity);
        charity.save();
        req.flash(`success`, `Updated charity info`);
        res.redirect(`/charities/${charity._id}`);
    } else {
        req.flash(`error`, `Failed to update charity info`);
    }

    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:charityID', canEditCharity, (req, res) => {
    const { charity } = res.locals;
    if (charity) {
        if (window.confirm(`This will permanently delete the charity, are you sure?`)) {
            charity.remove((err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove charity: ${err.message}`);
                } else {
                    req.flash(`success`, `Charity deleted`);
                }
            });
            return res.redirect('/charities');
        } else {
            return res.redirect('back');
        }
    }
});

module.exports = router;
