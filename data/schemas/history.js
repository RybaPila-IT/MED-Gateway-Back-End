const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
    patient_name: {
        type: String,
        required: true,
        maxLength: [50, 'Patient name must be shorter than 50 characters, got {VALUE} characters instead']
    },
    patient_surname: {
        type: String,
        required: true,
        maxLength: [50, 'Patient surname must be shorter than 50 characters, got {VALUE} characters instead']
    },
    description: {
        type: String,
        maxLength: [500, 'Description must be shorter than 500 characters, got {VALUE} characters instead']
    },
    date: {
        type: Date,
        required: true,
        default: new Date()
    },
    prediction: {
        type: mongoose.Schema.Types.Mixed
    },
    has_photo: {
        type: Boolean,
        required: true,
        default: false
    },
    photo_url: {
        type: String
    }
});

const historySchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    entries: {
        type: [historyEntrySchema],
        default: []
    }
});
// We will often search by the product and user id throughout the history.
historySchema.index({product_id: 1, user_id: 1}, {unique: true});

module.exports = historySchema;