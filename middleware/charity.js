const Charity = require('../models/charity');
const isLoggedIn = require('./isLoggedIn');

module.exports = {
    /**
     * Passes if the charity referenced in req is found
     */
    cacheCharity: (req, res, next) => {
        Charity.findById(req.params.charityID, (err, charity) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Charity not found: ${err.message}`);
                return res.redirect(`back`);
            }

            // pass the charity through to the next route
            res.locals.charity = charity;
            return next();
        });
    },

    /**
     * Passes if there is a valid user,
     * and the charity referenced in req is found
     */
    canEditCharity: (req, res, next) => {
        isLoggedIn(req, res, () => {
            module.exports.cacheCharity(req, res, () => {
                const { charity } = res.locals;
                if (charity && res.locals.user._id.equals(charity.ownerID)) {
                    return next();
                }

                req.flash(`error`, `You don't have permission for that`);

                // clear out the charity so it isn't used by accident
                delete res.locals.charity;

                // if they are logged in but anything else goes wrong,
                // just send them back where they came from
                res.redirect('back');
            });
        });
    },
}
