const Allocation = require('../models/allocation');
const { isLoggedIn } = require('./misc');

module.exports = {
    /**
     * Passes if the allocation referenced in req is found
     */
    cacheAllocation: (req, res, next) => {
        Allocation.findById(req.params.allocationID, (err, allocation) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Allocation not found: ${err.message}`);
                return res.redirect(`back`);
            }

            // pass the allocation through to the next route
            res.locals.allocation = allocation;
            return next();
        });
    },

    /**
     * Passes if there is a valid player,
     * and the allocation referenced in req is found
     */
    canEditAllocation: (req, res, next) => {
        isLoggedIn(req, res, () => {
            module.exports.cacheAllocation(req, res, () => {
                const { allocation } = res.locals;
                if (allocation && res.locals.player._id.equals(allocation.playerID)) {
                    return next();
                }

                req.flash(`error`, `You don't have permission for that`);

                // clear out the allocation so it isn't used by accident
                delete res.locals.allocation;

                // if they are logged in but anything else goes wrong,
                // just send them back where they came from
                res.redirect('back');
            });
        });
    },
}
