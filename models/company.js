const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    verified: Boolean,

    name: String,
    webSite: String,
    about: String,

    phoneNumber: String,
    address: String,
    city: String,
    state: String,
    zipcode: String,

    ownerID: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
},
{
    timestamps: true,
    discriminatorKey: '_type',
});

CompanySchema.methods.getDisplayName = function getDisplayName() {
    return this.name || 'UNKNOWN';
};

module.exports = mongoose.model("Company", CompanySchema);