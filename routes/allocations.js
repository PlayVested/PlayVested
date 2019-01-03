const express = require('express');
const router = express.Router({mergeParams: true});

const { canEditAllocation } = require('../middleware/allocation');

const Allocation = require('../models/allocation');

// 'index' route
// router.get('/', (req, res) => {
//     res.render('allocations/index');
// });

// 'new' route
// router.get('/new', (req, res) => {
//     res.render('allocations/new');
// });

// 'create' route
router.post('/', (req, res) => {
    const newAllocation = {
        playerID: res.locals.player._id,
        charityID: req.body.charityID,
        percentage: Number(100.0),
    };

    Allocation.create(newAllocation, (err, createdAllocation) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            req.flash(`error`, `Error creating allocation: ${err.message}`);
        } else {
            console.log('Created: ' + createdAllocation);
            req.flash(`success`, `Successfully created allocation!`);
            res.redirect(`/allocations/${createdAllocation._id}`);
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
        if (window.confirm(`This will permanently delete the allocation, are you sure?`)) {
            allocation.remove((err) => {
                if (err) {
                    console.error(`Error: ${err.message}`);
                    req.flash(`error`, `Failed to remove allocation: ${err.message}`);
                } else {
                    req.flash(`success`, `Allocation deleted`);
                }
            });
            return res.redirect('/allocations');
        } else {
            return res.redirect('back');
        }
    }
});

module.exports = router;