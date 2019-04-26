const mongoose = require('mongoose');
const Company = require('./company');

const DeveloperSchema = new mongoose.Schema({
}, Company.schema.options);

module.exports = Company.discriminator("Developer", DeveloperSchema);