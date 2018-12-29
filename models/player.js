const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
    gameID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Game"
    },
},
{
  timestamps: true
});

module.exports = mongoose.model("Player", PlayerSchema);