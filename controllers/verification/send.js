const httpStatus = require('http-status-codes');
const log = require('npmlog');

const Endpoints = require("../../env/endpoints");
const Verification = require('../../data/models/verification');
const {defaultOptions, transporter} = require('../../mail/transporter');
const {fetchUserModelByEmail} = require('../user/login');


const requireEmailInBody = (req, res, next) => {
    const {email} = req.body;
    if (!email) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Email property is missing'
            });
    }
    req.context.email = email;
    next();
}


const createVerification = async (req, res, next) => {
    const {user} = req.context;
    const {_id: userID} = user;
    let ver = undefined;
    try {
        ver = await Verification.findOneAndUpdate({user_id: userID}, {$set: {user_id: userID}}, {
            new: true,
            upsert: true
        });
    } catch (err) {
        log.log('error', 'SEND VERIFICATION', 'Error at createVerification:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while sending verification email'
            });
    }
    if (!ver) {
        log.log('error', 'SEND VERIFICATION', 'Error at createVerification: document was not created');
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while sending verification email'
            });
    }
    req.context.verification = ver;
    next();
}

const sendVerificationEmail = async (req, res, next) => {
    const {verification, email} = req.context;
    const {_id: verificationID} = verification;
    const link = `${Endpoints.MedGatewayBackend}/api/verify/${verificationID}`;
    const options = {
        ...defaultOptions,
        to: email,
        subject: 'Account verification',
        html: `<h3>Welcome to MED-Gateway System!</h3>In order to verify the account please visit this <a href="${link}">link</a>`
    };
    try {
        await transporter.sendMail(options);
    } catch (err) {
        log.log('error', 'SEND VERIFICATION', 'Error at sendVerificationEmail:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Unable to send verification email. Try again later or check if provided email is correct'
            });
    }
    log.log('info', 'SEND VERIFICATION', 'Verification email has been sent to', email);
    next();
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            message: 'Verification email has been sent!'
        })
}

const sendVerificationMail = [
    requireEmailInBody,
    fetchUserModelByEmail,
    createVerification,
    sendVerificationEmail,
    sendResponse
];

module.exports = {
    sendVerificationMail,
    // Exporting single functions for testing purposes.
    requireEmailInBody,
    createVerification,
    sendVerificationEmail,
    sendResponse
};

