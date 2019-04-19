const emailUtil = require('../utils/email')

const express = require('express');
const router = express.Router({mergeParams: true});

const {isLoggedIn} = require('../middleware/misc');
const Invitation = require('../models/invitation');
const Player = require('../models/player');
const Record = require('../models/record');
const User = require('../models/user');

// 'new' route
router.get('/new', isLoggedIn, (req, res) => {
    res.render('friends/new');
});

// 'create' route
// this is called by games to create a new friend invitation
router.post('/', isLoggedIn, (req, res) => {
    User.find({'email': req.body.friend.email}, (friendErr, foundFriend) => {
        if (friendErr) {
            req.flash(`error`, `Error sending friend request: ${friendErr}`);
        } else if (!foundFriend) {
            // send invite to create account
        }

        // always send them back so they can send another request or try again if there was an error
        const invitation = {
            email: req.body.friend.email,
            invitedBy: req.user._id,
        };
        const options = {
            upsert: true
        };
        Invitation.findOneAndUpdate(invitation, invitation, options, async (invitationErr, existingInvitation) => {
            if (invitationErr) {
                req.flash(`error`, `Error sending friend request: ${friendErr}`);
            } else if (existingInvitation) {
                // if this is valid it means it was already created
                req.flash(`success`, `Invitation is already pending for that email`);
            } else {
                const subjectStr = `Start Gaming for Good with ${req.user.getDisplayName()}`;
                const bodyStr = `
                    <div>
                        You have been invited to become friends on the PlayVested platform by ${req.user.getDisplayName()}.
                    </div>
                    <div>
                        ${req.body.friend.note}
                    </div>
                    <div>
                        Please go to
                        <a href="${process.env.BASE_WEB_ADDRESS}/login?username=${invitation.email}">
                            ${process.env.BASE_WEB_ADDRESS}
                        </a> and sign in or create an account to manage the invitation.
                    </div>
                `;
                const retVal = await emailUtil.sendEmail(invitation.email, subjectStr, bodyStr);
                if (retVal && retVal.error) {
                    req.flash(`error`, `Failed to send friend invitation: ${retVal.error}`);
                } else {
                    req.flash(`success`, `Invitation sent!`);
                }
            }

            return res.redirect('back');
        });
    });
});

// 'show' route
router.get('/:friendID', isLoggedIn, (req, res) => {
    if (req.user.friends.indexOf(req.params.friendID) === -1) {
        req.flash(`error`, `Unknown friend`);
        return res.redirect('back');
    } else {
        User.findById(req.params.friendID, (friendErr, foundFriend) => {
            if (friendErr) {
                req.flash(`error`, `Error sending friend request: ${friendErr}`);
                return res.redirect('back');
            } else {
                Player.find({ownerID: [req.user._id, foundFriend._id]}, (playerErr, players) => {
                    if (playerErr) {
                        console.error(`Error: ${playerErr}`);
                        return res.redirect('back');
                    } else {
                        let playerLookup = {};
                        players.forEach((player) => {
                            playerLookup[player._id] = player.ownerID;
                        });
                        Record.find({playerID: players}).sort({createdAt: 'desc'}).populate('gameID').exec((recordErr, records) => {
                            if (recordErr) {
                                console.error(`Error: ${recordErr}`);
                                res.redirect('back');
                            } else {
                                let games = {};
                                games[req.user._id] = [];
                                games[foundFriend._id] = [];

                                let recordTotal = {};
                                recordTotal[req.user._id] = 0;
                                recordTotal[foundFriend._id] = 0;

                                records.forEach((record) => {
                                    const ownerID = playerLookup[record.playerID];
                                    recordTotal[ownerID] += record.amountEarned;
                                    if (games[ownerID].indexOf(record.gameID) === -1) {
                                        games[ownerID].push(record.gameID);
                                    }
                                });

                                Object.keys(recordTotal).forEach((key) => {
                                    recordTotal[key] = Math.round(recordTotal[key] * 100) / 100;
                                });

                                return res.render('friends/show', {friend: foundFriend, games, records: recordTotal});
                            }
                        });
                    }
                });
            }
        });
    }
});

// 'delete' route
router.delete('/:friendID', isLoggedIn, (req, res) => {
    User.findById(req.params.friendID, (friendErr, foundFriend) => {
        if (friendErr) {
            req.flash(`error`, `Error finding friend: ${friendErr}`);
        } else {
            const deleteFriend = (user, friend) => {
                let friendIdx = user.friends.indexOf(friend._id);
                if (friendIdx !== -1) {
                    user.friends.splice(friendIdx, 1);
                    user.save();
                }
            }

            deleteFriend(req.user, foundFriend);
            deleteFriend(foundFriend, req.user);

            req.flash(`success`, `Friend removed`);
        }

        return res.redirect('back');
    });
});

function deleteInvitation(req, friendID) {
    return new Promise((resolve, reject) => {
        Invitation.findOne({email: req.user.email, invitedBy: friendID}, (invitationErr, foundInvitation) => {
            foundInvitation.remove((err) => {
                if (err) {
                    reject(false);
                } else {
                    resolve(true);
                }
            });
        });
    });
 }

// 'accept' route
router.get('/:friendID/accept', isLoggedIn, (req, res) => {
    User.findById(req.params.friendID, async (err, foundUser) => {
        if (err) {
            req.flash(`error`, `Failed to get friend: ${err.message}`);
        } else {
            if (foundUser.friends.indexOf(req.user._id) === -1) {
                foundUser.friends.push(req.user._id);
                foundUser.save();
            }
            if (req.user.friends.indexOf(foundUser._id) === -1) {
                req.user.friends.push(foundUser._id);
                req.user.save();
            }

            // invitation has been applied, go ahead and dump it
            const status = await deleteInvitation(req, foundUser._id);
            if (status) {
                req.flash(`success`, `You are now friends!`);
            } else {
                req.flash(`error`, `Failed to remove invitation: ${err.message}`);
            }
            res.redirect('back');
        }
    });
});

// 'reject' route
router.get('/:friendID/reject', isLoggedIn, async (req, res) => {
    // invitation has been applied, go ahead and dump it
    const status = await deleteInvitation(req, req.params.friendID);
    if (!status) {
        req.flash(`error`, `Failed to remove invitation: ${err.message}`);
    }
    res.redirect('back');
});

module.exports = router;
