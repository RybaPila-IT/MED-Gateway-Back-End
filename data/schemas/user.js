const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxLength: [30, 'Name cannot be longer than 30 characters, got {VALUE} characters instead']
    },
    surname: {
        type: String,
        required: true,
        maxLength: [45, 'Surname cannot be longer than 45 characters, got {VALUE} characters instead']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        maxLength: [60, 'Email cannot be longer than 60 characters, got {VALUE} characters instead']
    },
    password: {
        type: String,
        required: true,
        minLength: [5, 'Password must be at least 5 characters long']
    },
    organization: {
        type: String,
        required: true,
        maxLength: [100, 'Organization cannot be longer than 100 characters, got {VALUE} instead']
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ['unverified', 'active', 'blocked'],
            message: '{VALUE} is not supported user status option'
        },
        default: 'unverified'
    },
    picture: {
        type: String,
        default: ''
    },
    last_login: {
        type: Date,
        default: Date.now
    }
});

module.exports = userSchema;