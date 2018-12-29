const express = require('express');
const router = express.Router({mergeParams: true});

const { canEditDonation } = require('../middleware/donation');

const Donation = require('../models/donation');

// 'index' route
// router.get('/', (req, res) => {
//     res.render('donations/index');
// });

// 'new' route
// router.get('/new', (req, res) => {
//     res.render('donations/new');
// });

// 'create' route
router.post('/', (req, res) => {
    const newDonation = {
        playerID: res.locals.player._id,
        charityID: req.body.charityID,
        percentage: Number(100.0),
    };

    Donation.create(newDonation, (err, createdDonation) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating donation: ${err.message}`);
        } else {
            console.log('Created: ' + createdDonation);
            req.flash(`success`, `Successfully created donation!`);
            res.redirect(`/donations/${createdDonation._id}`);
        }
    });
});

// 'show' route
router.get('/:donationID', canEditDonation, (req, res) => {
    return res.render('donations/show');
});

// 'edit' route
router.get('/:donationID/edit', canEditDonation, (req, res) => {
    return res.render('donations/edit');
});

// 'update' route
router.put('/:donationID', canEditDonation, (req, res) => {
    const { donation } = res.locals;
    if (donation) {
        Object.assign(donation, req.body.donation);
        donation.save();
        req.flash(`success`, `Updated donation info`);
        res.redirect(`/donations/${donation._id}`);
    } else {
        req.flash(`error`, `Failed to update donation info`);
    }

    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:donationID', canEditDonation, (req, res) => {
    const { donation } = res.locals;
    if (donation) {
        if (window.confirm(`This will permanently delete the donation, are you sure?`)) {
            donation.remove((err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove donation: ${err.message}`);
                } else {
                    req.flash(`success`, `Donation deleted`);
                }
            });
            return res.redirect('/donations');
        } else {
            return res.redirect('back');
        }
    }
});

module.exports = router;
