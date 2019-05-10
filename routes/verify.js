const express = require('express');
const router = express.Router({mergeParams: true});

const emailUtil = require('../utils/email')

const Company = require('../models/company');

const {isLoggedIn} = require('../middleware/misc');

// 'accept' route
router.get('/accept/:verifyID', isLoggedIn, (req, res) => {
    Company.findById(req.params.verifyID).populate('ownerID').exec(async (err, foundCompany) => {
        if (err) {
            req.flash(`error`, `Failed to get company: ${err.message}`);
        } else {
            foundCompany.verified = true;
            foundCompany.save();

            // email owner(s) that they are a verified
            const subjectStr = `${foundCompany.getDisplayName()} has been approved!`;
            await foundCompany.ownerID.forEach(async (companyOwner) => {
                const bodyStr = `
                    <div>
                        Congratulations, ${foundCompany.getDisplayName()} has been approved on PlayVested
                        <br>
                        <a href="${process.env.BASE_WEB_ADDRESS}/login?username=${companyOwner.username}">Login</a> to update its information
                    </div>
                `;
                const retVal = await emailUtil.sendEmail(companyOwner.username, subjectStr, bodyStr);

                if (retVal && retVal.error) {
                    req.flash(`error`, `Failed to send verification email for ${foundCompany.getDisplayName()}: ${retVal.error}`);
                } else {
                    req.flash(`success`, `Verification sent!`);
                }
            });

            return res.redirect('back');
        }
    });
});

// 'reject' route
router.get('/reject/:verifyID', isLoggedIn, async (req, res) => {
    Company.findById(req.params.verifyID).populate('ownerID').exec((err, foundCompany) => {
        if (err) {
            req.flash(`error`, `Failed to get company: ${err.message}`);
        } else {
            foundCompany.remove(async (err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove company: ${err.message}`);
                } else {
                    req.flash(`success`, `Company deleted`);
                }

                // email owner(s) that they have been rejected
                const subjectStr = `${foundCompany.getDisplayName()} has been denied`;
                await foundCompany.ownerID.forEach(async (companyOwner) => {
                    const bodyStr = `
                        <div>
                            Sorry, ${foundCompany.getDisplayName()} has been denied on PlayVested
                            <br>
                            Email <a href="email:info@playvested.com">info@playvested.com</a> if you feel the application was wrongfully rejected
                        </div>
                    `;
                    const retVal = await emailUtil.sendEmail(companyOwner.username, subjectStr, bodyStr);

                    if (retVal && retVal.error) {
                        req.flash(`error`, `Failed to send denial email for ${foundCompany.getDisplayName()}: ${retVal.error}`);
                    } else {
                        req.flash(`success`, `Denial sent!`);
                    }
                });

                return res.redirect('back');
            });
        }
        });
});

module.exports = router;
