module.exports = {
    isLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }

        req.flash(`error`, `Please log in first`);
        res.redirect('/login');
    },

    isOwner: (user, model) => {
        if (user && model && model.ownerID) {
            for (let i = 0; i < model.ownerID.length; i++) {
                const ownerID = model.ownerID[i];
                if (user._id.equals(ownerID._id)) {
                    return true;
                }
            }
        }

        return false;
    },
}