const express = require('express');
const router = express.Router({mergeParams: true});

const { canEditAllocation } = require('../middleware/allocation');
const { isLoggedIn } = require('../middleware/misc');

const Allocation = require('../models/allocation');
const Player = require('../models/player');

// 'create' route
router.post('/', (req, res) => {
    const newAllocation = {
        playerID: req.body.playerID,
        charityID: req.body.charityID,
        percentage: req.body.percentage || Number(100.0),
    };

    Allocation.create(newAllocation, (err, createdAllocation) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating allocation: ${err.message}`);
        } else {
            console.log('Created: ' + createdAllocation);
            req.flash(`success`, `Successfully created allocation!`);
            res.redirect(`/users/${req.user._id}`);
        }
    });
});

// 'show' route
router.get('/:allocationID', canEditAllocation, (req, res) => {
    return res.render('allocations/show');
});

// 'edit' route
router.get('/:allocationID/edit', canEditAllocation, (req, res) => {
    return res.render('allocations/edit');
});

// 'bulk update' route
router.put('/bulk', isLoggedIn, (req, res) => {
    const { allocations } = req.body;
    const total = Object.values(allocations).reduce((total, num) => parseInt(total) + parseInt(num));

    Allocation.find({'playerID': req.user.defaultPlayer}, (allocErr, foundAllocations) => {
        if (allocErr) {
            console.error(`Error: ${allocErr.message}`);
            req.flash(`error`, `Error finding allocations: ${allocErr.message}`);
        } else {
            Object.keys(allocations).forEach((allocID) => {
                const pct = Math.round(100.0 * allocations[allocID] / total);
                if (!foundAllocations || !foundAllocations.find((foundAlloc) => {
                    if (foundAlloc._id.equals(allocID)) {
                        if (foundAlloc.percentage !== pct) {
                            if (pct > 0) {
                                foundAlloc.percentage = pct;
                                foundAlloc.save();
                            } else {
                                foundAlloc.remove();
                            }
                        }
                        return true;
                    }

                    return false
                })) {
                    // didn't find the allocation, create a new one if it is positive
                    if (pct > 0) {
                        const newAlloc = {
                            playerID: req.user.defaultPlayer._id,
                            charityID: allocID,
                            percentage: pct
                        };
                        Allocation.create(newAlloc, (createErr, createdAlloc) => {
                            if (createErr) {
                                console.error(`Error: ${createErr.message}`);
                                req.flash(`error`, `Error creating allocations: ${createErr.message}`);
                            }
                        });
                    }
                }
            });
        }

        res.redirect('back');
    });
});

// 'update' route
router.put('/:allocationID', canEditAllocation, (req, res) => {
    const { allocation } = res.locals;
    if (allocation) {
        Object.assign(allocation, req.body.allocation);
        allocation.save();
        req.flash(`success`, `Updated allocation info`);
        res.redirect(`/allocations/${allocation._id}`);
    } else {
        req.flash(`error`, `Failed to update allocation info`);
    }

    return res.redirect(`/`);
});

// 'delete' route
router.delete('/:allocationID', canEditAllocation, (req, res) => {
    const { allocation } = res.locals;
    if (allocation) {
        allocation.remove((err) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Failed to remove allocation: ${err.message}`);
            } else {
                req.flash(`success`, `Allocation deleted`);
            }

            return res.redirect('back');
        });
    } else {
        req.flash(`error`, `Failed to get allocation`);
        return res.redirect('back');
    }
});

module.exports = router;
