const Charity = require(`./models/charity`);
const Developer = require(`./models/devolper`);
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

const defaultDevelopers = [
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

const defaultGames = [
    {
        name: `Endless Bananas`,
    },
    {
        name: `Banana Crush`,
    },
    {
        name: `The Flinger`,
    },
    {
        name: `My Little Monkey`,
    },
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

function createCharity(charity, idx) {
    return new Promise((resolve, reject) => {
        const ownerID = [defaultUsers[idx]._id];
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

function createDeveloper(developer, idx) {
    return new Promise((resolve, reject) => {
        const baseIdx = defaultCharities.length;
        const ownerID = [defaultUsers[baseIdx + idx]._id];
        developer.ownerID = ownerID;
        developer.username = '' + ownerID[0]; // TODO: Figure out why this is required, replace with another field
        Developer.create(developer, (err, newDeveloper) => {
            if (err) {
                console.error(`Error creating developer: ${err}`);
                reject();
            } else {
                console.error(`Created: ${newDeveloper}`);
                resolve(newDeveloper);
            }
        });
    });
}

function createGame(game, idx) {
    return new Promise((resolve, reject) => {
        const devID = defaultDevelopers[Math.floor(idx / 2)]._id;
        game.devID = devID;
        game.username = game.name; // TODO: Figure out why this is required, replace with another field
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

function wipeHelper(db, name) {
    return new Promise((resolve, reject) => {
        db.remove({}, (err) => {
            if (err) {
                console.error(`Error wiping ${name}: ${err}`);
                reject();
            } else {
                console.log(`All ${name} have been removed`);
                resolve();
            }
        });
    });
}

function wipeDBs() {
    const promises = [
        wipeHelper(User, 'users'),
        wipeHelper(Charity, 'charities'),
        wipeHelper(Developer, 'developers'),
        wipeHelper(Game, 'games'),
    ];

    return Promise.all(promises).then(() => {;
        console.log(`All DBs wiped`);
    });
}

function seedDB(db, name, defaultObjs, createFunc) {
    return new Promise((resolve, reject) => {
        db.find({}, (err, objs) => {
            if (err) {
                console.error(`Error creating ${name}: ${err}`);
                reject();
            } else if (objs.length === 0) {
                console.log(`\nCreating default ${name}`);
                let promises = [];
                defaultObjs.forEach(async (obj, idx) => {
                    promises.push(
                        createFunc(obj, idx).then((newObj) => {
                            defaultObjs[idx] = newObj;
                        })
                    );
                });

                Promise.all(promises).then(() => {
                    resolve();
                });
            } else {
                console.log(`There is already ${name} data`);
                reject();
            }
        });
    });
}

// if there is nothing in the DB, populate it with a couple enrties
module.exports = async () => {
    // uncomment this if you want to clear the DB first
    // await wipeDBs();

    // have to wait for users to get created before moving on
    // since we reference the IDs in charities and developers
    await seedDB(User, 'users', defaultUsers, createUser);
    await seedDB(Charity, 'charities', defaultCharities, createCharity);
    await seedDB(Developer, 'developers', defaultDevelopers, createDeveloper);

    // games must come after developers
    await seedDB(Game, 'games', defaultGames, createGame);
};
