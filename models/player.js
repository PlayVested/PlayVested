const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    ownerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    gameID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game"
    },
},
{
  timestamps: true
});

module.exports = mongoose.model("Player", PlayerSchema);