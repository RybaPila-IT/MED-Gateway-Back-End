const nodemailer = require('nodemailer');
const EnvKeys = require('../env/keys');

const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: {
        user: process.env[EnvKeys.emailUsername],
        pass: process.env[EnvKeys.emailPassword]
    }
});

const defaultOptions = {
    from: process.env[EnvKeys.emailUsername],
}

module.exports = {
    transporter,
    defaultOptions
};