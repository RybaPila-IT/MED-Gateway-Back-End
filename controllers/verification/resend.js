const httpStatus = require('http-status-codes');
const chalk = require('chalk');

const Verification = require('../../data/models/verification');
const {resendMiddlewarePipeline} = require('../../middleware/verification/resend');
const {defaultOptions, transporter} = require('../../mail/transporter');


const fetchVerificationEntry = (req, res, next) => {
    const {_id: userId} = req.user;

    Verification
        .findOne({user_id: userId})
        .then(verDoc => {
            if (verDoc) {
                req.ver_id = verDoc['_doc']['_id'];
                return next();
            }

            Verification
                .create({
                    user_id: userId
                })
                .then(doc => {
                    req.ver_id = doc['_doc']['_id'];
                    return next();
                })
                .catch(err => {
                    console.log(chalk.red('error: creating verification', err.message));
                    res
                        .status(httpStatus.INTERNAL_SERVER_ERROR)
                        .json({
                            message: `error: create verification ${err.message}`
                        });
                })


        })
        .catch(err => {
            console.log(chalk.red('error: find verification', err.message));
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `error while finding verification entry ${err.message}`
                });
        })
}

// TODO (radek.r) delete this duplicate code.
const sendVerificationEmail = (req, res, next) => {

    const {
        email: receiver,
        ver_id: verificationId
    } = req;

    const link = `http://localhost:5000/api/verify/${verificationId}`;

    const options = {
        ...defaultOptions,
        to: receiver,
        subject: 'Account verification',
        text: `Welcome to MED-Gateway System!\n\nIn order to verify the account please visit this link: ${link}`
    };

    transporter
        .sendMail(options)
        .then(() => {
            next();
        })
        .catch(err => {
            console.log(chalk.red('error: sending the verification email', err.message));
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `Unable to send verification email. Error: ${err.message}`
                });
        });
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            message: 'Verification mail has been send!'
        })
}

const resendVerification = [
    resendMiddlewarePipeline,
    fetchVerificationEntry,
    sendVerificationEmail,
    sendResponse
];

module.exports = {
    resendVerification
};

