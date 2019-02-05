const Developer = require('../models/developer');
const {isLoggedIn, isOwner } = require('./misc');

module.exports = {
    /**
     * Passes if the developer referenced in req is found
     */
    cacheDeveloper: (req, res, next) => {
        Developer.findById(req.params.developerID).populate('ownerID').exec((err, developer) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Developer not found: ${err.message}`);
                return res.redirect(`back`);
            }

            // pass the developer through to the next route
            res.locals.developer = developer;
            return next();
        });
    },

    /**
     * Passes if there is a valid user,
     * and the developer referenced in req is found
     */
    canEditDeveloper: (req, res, next) => {
        isLoggedIn(req, res, () => {
            module.exports.cacheDeveloper(req, res, () => {
                const { developer } = res.locals;
                if (isOwner(req.user, developer)) {
                    return next();
                }

                req.flash(`error`, `You don't have permission for that`);

                // clear out the developer so it isn't used by accident
                delete res.locals.developer;

                // if they are logged in but anything else goes wrong,
                // just send them back where they came from
                res.redirect('back');
            });
        });
    },
}
