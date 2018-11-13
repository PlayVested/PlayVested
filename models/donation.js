const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const DonationSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    charityID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Charity"
    },
    percentage: Number,
},
{
  timestamps: true
});

DonationSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Donation", DonationSchema);