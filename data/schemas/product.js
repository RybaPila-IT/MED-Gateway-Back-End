const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxLength: [50, 'Product name must be shorter than 50 characters, got {VALUE} characters instead']
    },
    picture: {
        type: String,
        required: true,
        default: ''
    },
    short_description: {
        type: String,
        required: true,
        default: ''
    },
    full_description: {
        type: String,
        required: true,
        default: ''
    },
    usage_description: {
        type: String,
        required: true,
        default: ''
    },
    is_active: {
        type: Boolean,
        required: true,
        default: false
    }
});

module.exports = productSchema;


