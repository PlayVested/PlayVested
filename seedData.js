const Charity = require(`./models/charity`);
const Game = require(`./models/game`);
const User = require(`./models/user`);

// Static dummy data used to populate the DB if it is empty
const defaultUsers = [
    {
        username: 'Becca',
        email: `becca@unitedway.com`,
        firstName: `Becca`,
        lastName: `Guyette`,
    },
    {
        username: 'Randall',
        email: `randall_summit@usc.salvationarmy.org`,
        firstName: `Randall`,
        lastName: `Summit`,
    },
    {
        username: 'Theringer',
        email: `theringer@backflip.com`,
        firstName: `Tod`,
        lastName: `Ringer`,
    },
    {
        username: 'LukeSkywalker',
        email: `luke@radiangames.com`,
        firstName: `Luke`,
        lastName: `Schnider`,
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
    },
    {
        organizationName: `Salvation Army`,
        phoneNumber: '555-987-6543',
        address: `321 Downtown St`,
        city: `Champaign`,
        state: `IL`,
        zipcode: `61821`,
        taxID: `5678`,
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
    },
    {
        companyName: `Monkey Time`,
        phoneNumber: `555-473-4389`,
        address: `2001 Space Oddity`,
        city: `Mooreplank`,
        state: `TN`,
        zipcode: `89374`,
    }
];

function createUser(user) {
    return new Promise((resolve, reject) => {
        User.create(user, (err, newUser) => {
            if (err) {
                console.error(`Error creating user: ${err}`);
                reject();
            } else {
                console.error(`Created: ${newUser}`);
                resolve(newUser);
            }
        });
    });
}

function createCharity(charity, ownerID) {
    return new Promise((resolve, reject) => {
        charity.ownerID = ownerID;
        charity.username = '' + ownerID[0]; // TODO: Figure out why this is required, replace with another field
        Charity.create(charity, (err, newCharity) => {
            if (err) {
                console.error(`Error creating charity: ${err}`);
                reject();
            } else {
                console.error(`Created: ${newCharity}`);
                resolve(newCharity);
            }
        });
    });
}

function createGame(game, ownerID) {
    return new Promise((resolve, reject) => {
        game.ownerID = ownerID;
        game.username = '' + ownerID[0]; // TODO: Figure out why this is required, replace with another field
        Game.create(game, (err, newGame) => {
            if (err) {
                console.error(`Error creating game: ${err}`);
                reject();
            } else {
                console.error(`Created: ${newGame}`);
                resolve(newGame);
            }
        });
    });
}

function wipeDBs() {
    const promises = [
        new Promise((resolve, reject) => {
            User.remove({}, (err) => {
                if (err) {
                    console.error(`Error wiping users: ${err}`);
                    reject();
                } else {
                    console.log(`All users have been removed`);
                    resolve();
                }
            });
        }),
        new Promise((resolve, reject) => {
            Charity.remove({}, (err) => {
                if (err) {
                    console.error(`Error wiping charities: ${err}`);
                    reject();
                } else {
                    console.log(`All charities have been removed`);
                    resolve();
                }
            });
        }),
        new Promise((resolve, reject) => {
            Game.remove({}, (err) => {
                if (err) {
                    console.error(`Error wiping games: ${err}`);
                    reject();
                } else {
                    console.log(`All games have been removed`);
                    resolve();
                }
            });
        }),
    ];

    return Promise.all(promises).then(() => {;
        console.log(`All DBs wiped`);
    });
}

// if there is nothing in the DB, populate it with a couple enrties
module.exports = async () => {
    // uncomment this if you want to clear the DB first
    // await wipeDBs();

    // have to wait for users to get created before moving on
    // since we reference the IDs in the other test data
    await User.find({}, (err, users) => {
        if (err) {
            console.error(`Error creating users: ${err}`);
        } else if (users.length === 0) {
            console.log(`Createing default users`);
            defaultUsers.forEach(async (user, idx) => {
                await createUser(user).then((newUser) => {
                    defaultUsers[idx] = newUser;
                });
            });
        } else {
            console.log(`There is already charity data`);
        }
    });

    Charity.find({}, (err, charities) => {
        if (err) {
            console.error(`Error creating charities: ${err}`);
        } else if (charities.length === 0) {
            console.log(`Createing default charities`);
            defaultCharities.forEach((charity, idx) => {
                const ownerID = [defaultUsers[idx]._id];
                createCharity(charity, ownerID).then((newCharity) => {
                    defaultCharities[idx] = newCharity;
                });
            });
        } else {
            console.log(`There is already charity data`);
        }
    });

    Game.find({}, (err, games) => {
        if (err) {
            console.error(`Error creating games: ${err}`);
        } else if (games.length === 0) {
            console.log(`Createing default games`);
            const baseIdx = defaultCharities.length;
            defaultGames.forEach((game, idx) => {
                const ownerID = [defaultUsers[baseIdx + idx]._id];
                createGame(game, ownerID).then((newGame) => {
                    defaultGames[idx] = newGame;
                });
            });
        } else {
            console.log(`There is already game data`);
        }
    });
};
