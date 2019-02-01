const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router({mergeParams: true});

const {canEditCharity} = require('../middleware/charity');
const {canEditDeveloper} = require('../middleware/developer');
const {isLoggedIn} = require('../middleware/misc');

const Charity = require('../models/charity');
const Developer = require('../models/developer');
const Invitation = require('../models/invitation');
const User = require('../models/user');

// invite another person to be an owner
router.get('/charity/:charityID', canEditCharity, (req, res) => {
    res.render('invitations/new', {orgID: res.locals.charity._id});
});
router.get('/developer/:developerID', canEditDeveloper, (req, res) => {
    res.render('invitations/new', {orgID: res.locals.developer._id});
});

// 'create' route
router.post('/:orgID', isLoggedIn, async (req, res) => {
    const {user} = res.locals;

    const [foundCharity, foundDev] = await Promise.all([
        Charity.findById(req.params.orgID),
        Developer.findById(req.params.orgID),
    ]);

    const foundOrg = foundCharity || foundDev;
    if (!foundOrg) {
        req.flash(`error`, `Failed to find organization`);
        return res.redirect(`back`);
    } else if (foundOrg.ownerID.indexOf(user._id) === -1) {
        req.flash(`error`, `You must be an owner to invite others`);
        return res.redirect(`back`);
    } else if (!req.body.email) {
        //* TODO: better email validation
        req.flash(`error`, `You must supply a valid email`);
        return res.redirect(`back`);
    }

    const orgType = (foundCharity ? 'charities' : 'developers');

    // first check to make sure the email isn't already listed as an owner
    User.findOne({username: req.body.email}, (err, foundUser) => {
        // see if they are already in the owner list
        if (!err && foundUser && foundOrg.ownerID.indexOf(foundUser._id) !== -1) {
            req.flash(`success`, `That user is already an owner`);
            return res.redirect(`/${orgType}/${foundOrg._id}`);
        }

        // didn't find them as an existing owner
        // send them an invite
        const invitation = {email: req.body.email, invitedBy: req.user._id, charityID: (foundCharity || {})._id, devID: (foundDev || {})._id};
        const options = {upsert: true};
        Invitation.findOneAndUpdate(invitation, invitation, options, (err, createdInvitation) => {
            if (err) {
                req.flash(`error`, `Failed to create invitation: ${error}`);
                return res.redirect('back');
            } else if (createdInvitation) {
                // if this is valid it means it was already created
                req.flash(`success`, `Invitation is already pending for the user`);
                return res.redirect('back');
            } else {
                var transporter = nodemailer.createTransport({
                    host: "smtp-mail.outlook.com", // hostname
                    secureConnection: false, // TLS requires secureConnection to be false
                    port: 587, // port for secure SMTP
                    tls: {
                        ciphers: 'SSLv3'
                    },
                    auth: {
                        user: process.env.NOREPLY_EMAIL,
                        pass: process.env.NOREPLY_PW,
                    }
                });

                const mailOptions = {
                    from: 'noreply@playvested.com',
                    to: req.body.email,
                    subject: `Invitation to manage ${foundOrg.getDisplayName()}`,
                    html: `
                        <div>
                            You have been invited to help manage ${foundOrg.getDisplayName()} by ${user.getDisplayName()}.
                        </div>
                        <div>
                            ${req.body.note}
                        </div>
                        <div>
                            Please go to
                            <a href="https://playvested.herokuapp.com">
                                playvested.herokuapp.com
                            </a> and sign in or create an account to accept the invitation.
                        </div>
                    `,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        req.flash(`error`, `Failed to send invitation: ${error}`);
                        return res.redirect('back');
                    } else {
                        req.flash(`success`, `Invitation sent!`);
                        return res.redirect(`/${orgType}/${foundOrg._id}`);
                    }
                });
            }
        });
    });
});

module.exports = router;
