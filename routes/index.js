const express = require('express');
const fs = require('fs');
const {canVerifyCompany} = require('../middleware/company');
const nodemailer = require('nodemailer');
const passport = require('passport');
const router = express.Router({mergeParams: true});

const emailUtil = require('../utils/email')

const Charity = require('../models/charity');
const Company = require('../models/company');
const Developer = require('../models/developer');
const Invitation = require('../models/invitation');
const Player = require('../models/player');
const User = require('../models/user');

// index route
router.get('/', async (req, res) => {
    let files = [];
    let verifications = [];
    let email = '';
    if (req.user) {
        files = [
            {
                filename: 'download/DemoStandAlone.zip',
                desc: 'Sample Unity game',
            },
            {
                filename: 'download/DemoUnity.zip',
                desc: 'Unity project for sample game',
            },
        ];

        files.forEach((file) => {
            const stats = fs.statSync('public/' + file.filename);
            file.date = stats.mtime.toLocaleDateString();
        });

        email = req.user.username;

        if (canVerifyCompany(req.user)) {
            try {
                verifications = await Company.find({verified: false});
                // const charities = await Charity.find({verified: false});
                // const developers = await Developer.find({verified: false});
                // verifications = charities.concat(developers);
            } catch (err) {
                req.flash(`error`, `Error pulling companies to be verified`);
            }
        }
    }

    Invitation.find({email, charityID: null, devID: null}).populate('invitedBy').exec((invitationErr, invitations) => {
        if (invitationErr) {
            console.error(`Error: ${invitationErr}`);
            return res.redirect('back');
        }

        return res.render('home', {files, invitations, verifications});
    });
});

// show signup form
router.get('/register', (req, res) => {
    res.render('register');
});

async function sendEmailVerification(req, res, email) {
    const subjectStr = `Please verify your email`;
    const bodyStr = `
        <div>
            Click <a href="${process.env.BASE_WEB_ADDRESS}/verify?email=${email}">here</a> to verify your email and start gaming for good
        </div>
    `;
    const retVal = await emailUtil.sendEmail(email, subjectStr, bodyStr);
    if (retVal && retVal.error) {
        req.flash(`error`, `Failed to send verification email to ${email}: ${retVal.error}`);
    } else {
        req.flash(`success`, `Verification sent!`);
    }
    return res.render('verify', {email});
}

// handle signing up a new user
router.post('/register', async (req, res) => {
    User.register(req.body.user, req.body.password, (err, newUser) => {
        if (err) {
            console.error(err);
            req.flash(`error`, `Failed to register user: ${err.message}`);
            return res.redirect('/register');
        }

        // make sure we have a default player to associate with the user
        // it will hold allocations not associated with games
        Player.create({ownerID: newUser._id}, (playerErr, createdPlayer) => {
            if (playerErr) {
                newUser.remove();
                return res.redirect('/register');
            } else {
                // new user has been created
                newUser.defaultPlayer = createdPlayer;
                newUser.flags.verificationPending = true;
                newUser.save();

                // ask them to verify their email
                return sendEmailVerification(req, res, newUser.username);
            }
        });
    });
});

router.post('/resend', async (req, res) => {
    return await sendEmailVerification(req, res, req.body.email);
});

router.get('/verify', (req, res) => {
    User.findOne({username: req.query.email}, (userErr, foundUser) => {
        if (userErr || !foundUser) {
            req.flash(`error`, `Failed to find user associated with ${req.query.email}: ${userErr}`);
            return res.redirect('/register');
        } else {
            req.flash(`success`, `Thank you for verifying your email`);
            foundUser.flags.verificationPending = false;
            foundUser.save();
            return res.redirect(`/login?username=${req.query.email}`);
        }
    });
});

router.get('/login', (req, res) => {
    res.render('login', {username: req.query.username || '', password: req.query.password || ''});
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Invalid username or password',
}), (req, res) => {
    // cache the user just in case anything happens to the session while
    // this is processing in the background
    const {user} = req;

    if (user.flags.resetPassword) {
        // if they are working with a temp password, send them to the edit user
        // page and fill in the old password for them
        req.flash(`error`, `Please create a new password`);
        return res.redirect(`/users/${user._id}/edit?oldPassword=${req.body.password}`);
    } else if (user.flags.verificationPending) {
        return res.render('verify', {email: user.username});
    } else {
        // go ahead and start the process of moving to the home page
        // the rest of this can happen async in the background
        res.redirect('/');
    }

    // make sure the user has a default player associated with them
    if (!req.user.defaultPlayer) {
        Player.findOne({ownerID: req.user._id, gameID: undefined}, (playerErr, foundPlayer) => {
            if (playerErr) {
                console.error(`Error: ${playerErr}`);
                return;
            } else if (!foundPlayer) {
                Player.create({ownerID: req.user._id}, (createErr, createdPlayer) => {
                    if (createErr) {
                        console.error(`Error: ${createErr}`);
                        return;
                    } else if (!createdPlayer) {
                        console.error(`Failed to create default player`);
                        return;
                    }

                    req.user.defaultPlayer = createdPlayer;
                    req.user.save();
                });
            } else {
                req.user.defaultPlayer = foundPlayer;
                req.user.save();
            }
        });
    }

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
            const handleCompanyInvite = (err, foundCompany, companyType) => {
                if (err) {
                    req.flash(`error`, `Failed to get ${companyType} for invitation: ${err.message}`);
                } else {
                    // add the current user to the list of owners
                    foundCompany.ownerID.push(user);
                    foundCompany.save();
                    req.flash(`success`, `You are now an owner of ${foundCompany.name}`);

                    // invitation has been applied, go ahead and dump it
                    invitation.remove((err) => {
                        if (err) {
                            req.flash(`error`, `Failed to remove invitation: ${err.message}`);
                        }
                    });
                }
            };

            if (invitation.charityID) {
                Charity.findById(invitation.charityID, (err, foundCharity) => {
                    handleCompanyInvite(err, foundCharity, 'charity');
                });
            } else if (invitation.devID) {
                Developer.findById(invitation.devID, (err, foundDeveloper) => {
                    handleCompanyInvite(err, foundDeveloper, 'developer');
                });
            }
        });
    });
});

router.get('/forgot_password', (req, res) => {
    res.render('forgot_password');
});

router.post('/forgot_password', (req, res) => {
    User.findByUsername(req.body.username).then(
        (foundUser) => {
            if (!foundUser) {
                req.flash(`error`, `No user associated with ${req.body.username}`);
                return res.redirect('back');
            }

            const tempPassword = Math.random().toString(36).slice(-8);
            foundUser.setPassword(tempPassword).then(() => {
                foundUser.flags.resetPassword = true;
                foundUser.save();
            });

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
                to: foundUser.username,
                subject: `Reset password request`,
                html: `
                    <div>
                        Please use the temporary password below to log in to your PlayVested account. You will need to set a new password when you log in.
                    </div>
                    <div>
                        ${tempPassword}
                    </div>
                    <div>
                        Please go to
                        <a href="https://playvested.herokuapp.com/login?username=${foundUser.username}&password=${tempPassword}">
                            playvested.herokuapp.com
                        </a> and sign in to update your account.
                    </div>
                `,
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    req.flash(`error`, `Failed to reset password: ${error}`);
                    return res.redirect('back');
                } else {
                    req.flash(`success`, `Reset password email sent, please follow the directions to change your password`);
                    return res.redirect(`/`);
                }
            });
        },
        (error) => {
            console.error(`Error getting user to reset password: ${error}`);
            res.redirect('/');
        }
    );
});

router.get('/logout', (req, res) => {
    // this will trash the current session
    req.logout();

    req.flash(`success`, `Logged you out!`);

    // send them back to the home page
    res.redirect('/');
});

module.exports = router;