const mongoose = require('mongoose');
const verificationSchema = require('../schemas/verification');

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
