const Record = require('../models/record');
const isLoggedIn = require('./isLoggedIn');

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
            module.exports.cacheRecord(req, res, () => {
                const { record } = res.locals;
                if (record && record.playerID) {
                    res.locals.user.players.forEach(playerID => {
                        if (playerID.equals(record.playerID)) {
                            return next();
                        }
                    });
                }

                req.flash(`error`, `You don't have permission for that`);

                // clear out the record so it isn't used by accident
                delete res.locals.record;

                // if they are logged in but anything else goes wrong,
                // just send them back where they came from
                res.redirect('back');
            });
        });
    },
}
