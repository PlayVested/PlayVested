const { isLoggedIn } = require('./misc');
const Player = require('../models/player');

module.exports = {
    /**
     * Passes if the player referenced in req is found
     */
    cachePlayer: (req, res, next) => {
        Player.findById(req.params.playerID, (err, player) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Player not found: ${err.message}`);
                return res.redirect(`back`);
            }

            // pass the player through to the next route
            res.locals.player = player;
            return next();
        });
    },

    /**
     * Passes if there is a valid user,
     * and the player referenced in req is found
     */
    canEditPlayer: (req, res, next) => {
        isLoggedIn(req, res, () => {
            module.exports.cachePlayer(req, res, () => {
                const { player } = res.locals;
                if (player && player.ownerID && player.ownerID.equals(req.user._id)) {
                    return next();
                }

                req.flash(`error`, `User doesn't own that player`);
                return res.redirect(`back`);
            });
        });
    },
}
