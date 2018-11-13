const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const RecordSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    gameID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game"
    },
    amountEarned: Number,
},
{
  timestamps: true
});

RecordSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Record", RecordSchema);