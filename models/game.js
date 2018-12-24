const mongoose = require('mongoose');

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

module.exports = mongoose.model("Game", GameSchema);