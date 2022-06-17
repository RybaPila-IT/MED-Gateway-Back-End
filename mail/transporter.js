const nodemailer = require('nodemailer');
const {
    emailUsernameKey,
    emailPasswordKey
} = require('../suppliers/constants')

const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: {
        user: process.env[emailUsernameKey],
        pass: process.env[emailPasswordKey]
    }
});

const defaultOptions = {
    from: process.env[emailUsernameKey],
}

module.exports = {
    transporter,
    defaultOptions
};