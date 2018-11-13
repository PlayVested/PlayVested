const express = require('express');
const app = express();
const expressSession = require('express-session');

const bodyParser = require('body-parser');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const User = require('./models/user');
const seedData = require('./seedData');

const charitiesRoutes = require('./routes/charities');
const indexRoutes = require('./routes/index');
const donationRoutes = require('./routes/donations');
const gameRoutes = require('./routes/games');
const recordRoutes = require('./routes/records');
const userRoutes = require('./routes/users');

app.use(express.static(__dirname + "/public"));
app.use(express.static("./lib"));
app.use(methodOverride('_method'));
app.use(flash()); // this needs to come before passport configuration
app.set('view engine', 'ejs');

// set up express to store session info in the app
app.use(expressSession({
    secret: 'PlayVested is gaming for good',
    resave: false,
    saveUninitialized: false,
}));

// these need to come after the express session is set up with the secret
app.use(passport.initialize());
app.use(passport.session());

// tell passport how to deal with the User in the session
// these are provided by passportLocalMongoose
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 'body-parse' takes form data and builds a JS object out of it that we can manipulate
app.use(bodyParser.urlencoded({extended: true}));

// fall back on a local DB if one isn't provided through an env variable
const dbURL = process.env.DATABASEURL || 'mongodb://localhost/PlayVested';
mongoose.connect(dbURL, { useNewUrlParser: true }); // add ':27017' to the address if it needs a port

// maybe populate the DB with some starting data
seedData();

// this will inject the signed in user to all pages
// so we can reference it on any page
app.use((req, res, next) => {
    res.locals.error = req.flash('error');
    res.locals.warning = req.flash('warning');
    res.locals.success = req.flash('success');

    // pull the user from the DB so we can populate fields properly
    User.findById((req.user || {})._id).exec((err, user) => {
        if (err) {
            req.flash(`error`, `Failed to populate user: ${err.message}`);
        } else {
            res.locals.user = user;
        }
        next();
    });
});

// wire up all the sub-routes
app.use('/', indexRoutes);
app.use('/charities', charitiesRoutes);
app.use('/donations', donationRoutes);
app.use('/games', gameRoutes);
app.use('/records', recordRoutes);
app.use('/users', userRoutes);

const PORT = process.env.PORT || 1979;
const server = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

module.exports = server;
