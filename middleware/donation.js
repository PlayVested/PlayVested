const Donation = require('../models/donation');
const isLoggedIn = require('./isLoggedIn');

module.exports = {
    /**
     * Passes if the donation referenced in req is found
     */
    cacheDonation: (req, res, next) => {
        Donation.findById(req.params.donationID, (err, donation) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Donation not found: ${err.message}`);
                return res.redirect(`back`);
            }

            // pass the donation through to the next route
            res.locals.donation = donation;
            return next();
        });
    },

    /**
     * Passes if there is a valid player,
     * and the donation referenced in req is found
     */
    canEditDonation: (req, res, next) => {
        isLoggedIn(req, res, () => {
            module.exports.cacheDonation(req, res, () => {
                const { donation } = res.locals;
                if (donation && res.locals.player._id.equals(donation.playerID)) {
                    return next();
                }

                req.flash(`error`, `You don't have permission for that`);

                // clear out the donation so it isn't used by accident
                delete res.locals.donation;

                // if they are logged in but anything else goes wrong,
                // just send them back where they came from
                res.redirect('back');
            });
        });
    },
}
