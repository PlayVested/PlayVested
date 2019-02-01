const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router({mergeParams: true});

const { cacheCharity, canEditCharity } = require('../middleware/charity');
const { isLoggedIn, isOwner } = require('../middleware/misc');

const Charity = require('../models/charity');
const Invitation = require('../models/invitation');
const User = require('../models/user');

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

// invite another person to be an owner
router.get('/:charityID/invite', canEditCharity, (req, res) => {
    res.render('charities/invite');
});

router.post('/:charityID/invite', canEditCharity, (req, res) => {
    // first check to make sure the email isn't already listed as an owner
    const {charity, user} = res.locals;

    User.findOne({username: req.body.email}, (err, foundUser) => {
        // see if they are already in the owner list
        if (!err && foundUser && charity.ownerID.indexOf(foundUser._id) !== -1) {
            req.flash(`success`, `That user is already an owner`);
            return res.redirect(`/charities/${charity._id}`);
        }

        // didn't find them as an existing owner
        // send them an invite
        const invitation = {email: req.body.email, invitedBy: req.user._id, charityID: charity._id};
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
                    subject: `Invitation to manage ${charity.organizationName}`,
                    html: `
                        <div>
                            You have been invited to help manage ${charity.organizationName} by ${user.getDisplayName()}.
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
                        return res.redirect(`/charities/${charity._id}`);
                    }
                });
            }
        });
    });
});

module.exports = router;
