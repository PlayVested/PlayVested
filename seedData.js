const Charity = require(`./models/charity`);
const Developer = require(`./models/developer`);
const Game = require(`./models/game`);
const User = require(`./models/user`);

// Static dummy data used to populate the DB if it is empty
const defaultUsers = [
    {
        _id: `5c29a8f8d69ecb4544b308f3`,
        username: `becca@unitedway.com`,
        firstName: `Becca`,
        lastName: `Guyette`,
    },
    {
        _id: `5c29a8f8d69ecb4544b308f4`,
        username: `randall_summit@usc.salvationarmy.org`,
        firstName: `Randall`,
        lastName: `Summit`,
    },
    {
        _id: `5c29a8f8d69ecb4544b308f5`,
        username: `theringer@backflip.com`,
        firstName: `Tod`,
        lastName: `Ringer`,
    },
    {
        _id: `5c29a8f8d69ecb4544b308f6`,
        username: `luke@radiangames.com`,
        firstName: `Luke`,
        lastName: `Schnider`,
    },
];

const defaultCharities = [
    {
        _id: `5bfe194f4de8110016de4340`,
        organizationName: `United Way`,
        phoneNumber: '555-123-4567',
        address: `123 Whatever St`,
        city: `Champaign`,
        state: `IL`,
        zipcode: `61820`,
        taxID: `1234`,
    },
    {
        _id: `5bfe194f4de8110016de4341`,
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
        _id: `5bfe194f4de8110016de4342`,
        companyName: `Banaland Games`,
        phoneNumber: `555-192-8374`,
        address: `135 Uppity Ln`,
        city: `Porkshank`,
        state: `MD`,
        zipcode: `18273`,
    },
    {
        _id: `5bfe194f4de8110016de4343`,
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
        _id: `5bfe194f4de8110016de4344`,
        name: `Endless Bananas`,
    },
    {
        _id: `5bfe194f4de8110016de4345`,
        name: `Banana Crush`,
    },
    {
        _id: `5bfe194f4de8110016de4346`,
        name: `The Flinger`,
    },
    {
        _id: `5bfe194f4de8110016de4347`,
        name: `My Little Monkey`,
    },
];

function createUser(user) {
    return new Promise((resolve, reject) => {
        User.register(user, user.firstName, (err, newUser) => {
            if (err) {
                console.error(`Error creating user: ${err}`);
                reject();
            } else {
                console.error(`Created User: ${newUser}`);
                resolve(newUser);
            }
        });
    });
}

function createCharity(charity, idx) {
    return new Promise((resolve, reject) => {
        charity.ownerID = [defaultUsers[idx]._id];
        Charity.create(charity, (err, newCharity) => {
            if (err) {
                console.error(`Error creating charity: ${err}`);
                reject();
            } else {
                console.error(`Created Charity: ${newCharity}`);
                resolve(newCharity);
            }
        });
    });
}

function createDeveloper(developer, idx) {
    return new Promise((resolve, reject) => {
        const baseIdx = defaultCharities.length;
        developer.ownerID = [defaultUsers[baseIdx + idx]._id];
        Developer.create(developer, (err, newDeveloper) => {
            if (err) {
                console.error(`Error creating developer: ${err}`);
                reject();
            } else {
                console.error(`Created Developer: ${newDeveloper}`);
                resolve(newDeveloper);
            }
        });
    });
}

function createGame(game, idx) {
    return new Promise((resolve, reject) => {
        const devID = defaultDevelopers[Math.floor(idx / 2)]._id;
        game.devID = devID;
        Game.create(game, (err, newGame) => {
            if (err) {
                console.error(`Error creating game: ${err}`);
                reject();
            } else {
                console.error(`Created Game: ${newGame}`);
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
                resolve();
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
