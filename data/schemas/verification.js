const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true
    }
});

module.exports = verificationSchema;