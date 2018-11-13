const Charity = require(`./models/charity`);
const Game = require(`./models/game`);
const User = require(`./models/user`);

// Static dummy data used to populate the DB if it is empty
const defualtUsers = [
    {
        _id: '1234567890',
        username: 'Becca',
        email: `becca@unitedway.com`,
        firstName: `Becca`,
        lastName: `Guyette`,
    },
    {
        _id: '0987654321',
        username: 'Randall',
        email: `randall_summit@usc.salvationarmy.org`,
        firstName: `Randall`,
        lastName: `Summit`,
    },
];

const defaultCharities = [
    {
        organizationName: `United Way`,
        phoneNumber: '555-123-4567',
        address: `123 Whatever St`,
        city: `Champaign`,
        state: `IL`,
        zipcode: `61820`,
        taxID: `1234`,
        ownerID: '1234567890',
    },
    {
        organizationName: `Salvation Army`,
        phoneNumber: '555-987-6543',
        address: `321 Downtown St`,
        city: `Champaign`,
        state: `IL`,
        zipcode: `61821`,
        taxID: `5678`,
        ownerID: '0987654321',
    },
];

const defaultGames = [
    {
        companyName: `Banaland Games`,
        phoneNumber: `555-192-8374`,
        address: `135 Uppity Ln`,
        city: `Porkshank`,
        state: `MD`,
        zipcode: `18273`,
        ownerID: `102938`,
    },
    {
        companyName: `Monkey Time`,
        phoneNumber: `555-473-4389`,
        address: `2001 Space Oddity`,
        city: `Mooreplank`,
        state: `TN`,
        zipcode: `89374`,
        ownerID: `58490234`,
    }
];

async function createUser(user) {
    User.create(user, (err, newCharity) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else {
            console.error(`Created: ${newUser}`);
        }
    });
}

async function createCharity(charity) {
    Charity.create(charity, (err, newCharity) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else {
            console.error(`Created: ${newCharity}`);
        }
    });
}

async function createGame(game) {
    Game.create(game, (err, newGame) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else {
            console.error(`Created: ${newGame}`);
        }
    });
}

function wipeDBs() {
    Charity.remove({}, (err) => {
        console.log(`All charities have been removed`);
    });
}

// if there is nothing in the DB, populate it with a couple enrties
module.exports = () => {
    // uncomment this if you want to clear the DB first
    wipeDBs();

    User.find({}, (err, users) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else if (users.length === 0) {
            console.log(`Createing default users`);
            defualtUsers.forEach((user) => {
                createUser(user);
            });
        } else {
            console.log(`There is already charity data`);
        }
    });

    Charity.find({}, (err, charities) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else if (charities.length === 0) {
            console.log(`Createing default charities`);
            defaultCharities.forEach((charity) => {
                createCharity(charity);
            });
        } else {
            console.log(`There is already charity data`);
        }
    });

    Game.find({}, (err, games) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else if (games.length === 0) {
            console.log(`Createing default games`);
            defaultGames.forEach((game) => {
                createGame(game);
            });
        } else {
            console.log(`There is already game data`);
        }
    });
};
