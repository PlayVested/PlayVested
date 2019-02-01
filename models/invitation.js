const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
    email: String,
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    charityID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Charity"
    },
    devID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Developer"
    },
},
{
    timestamps: true
});

module.exports = mongoose.model("Invitation", InvitationSchema);