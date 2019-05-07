const express = require('express');
const router = express.Router({mergeParams: true});

const Company = require('../models/company');
const Developer = require('../models/developer');

const {isLoggedIn} = require('../middleware/misc');

// 'accept' route
router.get('/:verifyID/accept', isLoggedIn, (req, res) => {
    Company.findById(req.params.verifyID, (err, foundCompany) => {
        if (err) {
            req.flash(`error`, `Failed to get company: ${err.message}`);
        } else {
            foundCompany.verified = true;
            foundCompany.save();

            // *TODO* email owner(s) that they are a verified
            return res.redirect('back');
        }
    });
});

// 'reject' route
router.get('/:verifyID/reject', isLoggedIn, async (req, res) => {
    Company.findById(req.params.verifyID, (err, foundCompany) => {
        if (err) {
            req.flash(`error`, `Failed to get company: ${err.message}`);
        } else {
            foundCompany.remove((err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove company: ${err.message}`);
                } else {
                    req.flash(`success`, `Company deleted`);
                }

                // *TODO* email owner(s) that they jave been rejected
                return res.redirect('back');
            });
        }
        });
});

module.exports = router;
