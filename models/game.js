const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const GameSchema = new mongoose.Schema({
    name: String,
    devID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Developer"
    },
},
{
  timestamps: true
});

GameSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Game", GameSchema);