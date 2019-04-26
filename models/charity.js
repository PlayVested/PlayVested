const mongoose = require('mongoose');
const Company = require('./company');

const CharitySchema = new mongoose.Schema({
    taxID: String,
}, Company.schema.options);

module.exports = Company.discriminator("Charity", CharitySchema);