const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    firstName: String,
    lastName: String,
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
         }
    ],
},
{
  timestamps: true
});

UserSchema.methods.getDisplayName = function getDisplayName() {
    let displayName = '';
    if (this.firstName) {
        displayName = this.firstName;
        if (this.lastName) {
            displayName += ' ' + this.lastName;
        }
    } else {
        displayName = this.username;
    }
    return displayName;
};

UserSchema.plugin(passportLocalMongoose);
UserSchema.index({ _id: 1, username: 1 }, { unique: true });

module.exports = mongoose.model("User", UserSchema);