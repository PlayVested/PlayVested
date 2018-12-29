const isLoggedIn = require('./isLoggedIn');

module.exports = {
    /**
     * Passes if there is a valid user,
     * and the game referenced in req is found
     */
    userOwnsPlayer: (req, res, next) => {
        isLoggedIn(req, res, () => {
            module.exports.cacheGame(req, res, () => {
                if (req.user) {
                    req.user.players.forEach(playerID => {
                        if (playerID.equals(req.params.playerID)) {
                            return next();
                        }
                    });
                }

                req.flash(`error`, `User doesn't own that player`);
                return res.redirect(`back`);
            });
        });

        req.flash(`error`, `Please log in first`);
        return res.redirect('/login');
    },
}
