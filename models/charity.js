const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const CharitySchema = new mongoose.Schema({
    organizationName: String,
    ownerID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    contact: {
        email: String,
        firstName: String,
        lastName: String,
        address: String,
        city: String,
        state: String,
        zipcode: String,
        taxID: String,
    },
},
{
  timestamps: true
});

CharitySchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Charity", CharitySchema);