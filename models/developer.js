const mongoose = require('mongoose');

const DeveloperSchema = new mongoose.Schema({
    companyName: String,
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
  timestamps: true
});

DeveloperSchema.methods.getDisplayName = function getDisplayName() {
    return this.companyName;
};

module.exports = mongoose.model("Developer", DeveloperSchema);