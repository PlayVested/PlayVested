const Charity = require(`./models/charity`);

// Static dummy data used to populate the DB if it is empty
const defaultCharities = [
    {
        organizationName: `United Way`,
        contact: {
            email: `becca@unitedway.com`,
            firstName: `Becca`,
            lastName: `Guyette`,
            address: `123 Whatever St`,
            city: `Champaign`,
            state: `IL`,
            zipcode: `61820`,
            taxID: `1234`,
        },
    },
    {
        organizationName: `Salvation Army`,
        contact: {
            email: `randall_summit@usc.salvationarmy.org`,
            firstName: `Randall`,
            lastName: `Summit`,
            address: `321 Downtown St`,
            city: `Champaign`,
            state: `IL`,
            zipcode: `61821`,
            taxID: `5678`,
        },
    },
];

async function createCharity(charity) {
    Charity.create(charity, (err, newCharity) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else {
            console.error(`Created: ${newCharity}`);
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
    // wipeDBs();

    Charity.find({}, (err, charities) => {
        if (err) {
            console.error(`Error: ${err}`);
        } else if (charities.length === 0) {
            console.log(`Createing default charities`);
            defaultCharities.forEach((charity, idx) => {
                createCharity(charity);
            });
        } else {
            console.log(`There is already charity data`);
        }
    });
};
