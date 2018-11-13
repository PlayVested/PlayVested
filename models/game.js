const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const GameSchema = new mongoose.Schema({
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

GameSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Game", GameSchema);