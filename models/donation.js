const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
    playerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player"
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

module.exports = mongoose.model("Donation", DonationSchema);