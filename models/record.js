const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
    playerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Player"
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

module.exports = mongoose.model("Record", RecordSchema);