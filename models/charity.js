const mongoose = require('mongoose');

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

module.exports = mongoose.model("Charity", CharitySchema);