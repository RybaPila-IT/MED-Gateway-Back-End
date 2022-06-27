const httpStatus = require('http-status-codes');
const log = require('npmlog');

const Endpoints = require("../../env/endpoints");
const Verification = require('../../data/models/verification');
const {
    defaultOptions,
    transporter
} = require('../../mail/transporter');
const {
    fetchUserModelByEmail
} = require('../user/login');


const requireVerificationData = (req, res, next) => {
    const {email} = req.body;

    if (!email) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'email is missing'
            });
    }
    req.email = email;
    next();
}


const createVerification = async (req, res, next) => {
    const {_id} = req.user;
    let ver = undefined;
    try {
        ver = await Verification.findOneAndUpdate({user_id: _id}, {$set: {user_id: _id}}, {new: true, upsert: true});
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
    req.ver = ver['_doc'];
    next();
}

const sendVerificationEmail = async (req, res, next) => {
    const {_id} = req.ver;
    const {email} = req.user;
    const link = `${Endpoints.MedGatewayBackend}/api/verify/${_id}`;
    const options = {
        ...defaultOptions,
        to: email,
        subject: 'Account verification',
        html: `<h1>Welcome to MED-Gateway System!</h1>In order to verify the account please visit this <a href="${link}">link</a>`
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
    requireVerificationData,
    fetchUserModelByEmail,
    createVerification,
    sendVerificationEmail,
    sendResponse
];

module.exports = {
    sendVerificationMail,
    // Exporting single functions for testing purposes.
    requireVerificationData,
    createVerification,
    sendVerificationEmail,
    sendResponse
};

