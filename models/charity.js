const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const CharitySchema = new mongoose.Schema({
    organizationName: String,
    phoneNumber: String,
    address: String,
    city: String,
    state: String,
    zipcode: String,
    taxID: String,
    ownerID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
},
{
  timestamps: true
});

CharitySchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Charity", CharitySchema);