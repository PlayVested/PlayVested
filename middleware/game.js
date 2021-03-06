const Developer = require('../models/developer');
const Game = require('../models/game');
const { isLoggedIn, isOwner } = require('./misc');

module.exports = {
    /**
     * Passes if the game referenced in req is found
     */
    cacheGame: (req, res, next) => {
        Game.findById(req.params.gameID, (err, game) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                req.flash(`error`, `Game not found: ${err.message}`);
                return res.redirect(`back`);
            }

            // pass the game through to the next route
            res.locals.game = game;
            return next();
        });
    },

    /**
     * Passes if there is a valid user,
     * and the game referenced in req is found
     */
    canEditGame: (req, res, next) => {
        isLoggedIn(req, res, () => {
            module.exports.cacheGame(req, res, () => {
                Developer.findById(res.locals.game.devID, (err, developer) => {
                    if (err) {
                        console.error(`Error: ${err.message}`);
                    } else if (isOwner(req.user, developer)) {
                        return next();
                    }

                    req.flash(`error`, `You don't have permission for that`);

                    // clear out the game so it isn't used by accident
                    delete res.locals.game;

                    // if they are logged in but anything else goes wrong,
                    // just send them back where they came from
                    res.redirect('back');
                });
            });
        });
    },
}
