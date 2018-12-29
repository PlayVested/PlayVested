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

module.exports = mongoose.model("Developer", DeveloperSchema);