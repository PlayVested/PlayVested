const Record = require('../models/record');
const { isLoggedIn } = require('./misc');

module.exports = {
    /**
     * Passes if the record referenced in req is found
     */
    cacheRecord: (req, res, next) => {
        Record.findById(req.params.recordID, (err, record) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Record not found: ${err.message}`);
                return res.redirect(`back`);
            }

            // pass the record through to the next route
            res.locals.record = record;
            return next();
        });
    },

    /**
     * Passes if there is a valid user,
     * and the record referenced in req is found
     */
    canEditRecord: (req, res, next) => {
        isLoggedIn(req, res, () => {
            Record.findById(req.params.recordID).populate('playerID').exec((err, record) => {
                if (!err && req.user && record.playerID.ownerID && record.playerID.ownerID.equals(req.user._id)) {
                    // pass the record through to the next route
                    res.locals.record = record;
                    return next();
                }

                req.flash(`error`, `You don't have permission for that`);

                // if they are logged in but anything else goes wrong,
                // just send them back where they came from
                res.redirect('back');
            });
        });
    },
}
