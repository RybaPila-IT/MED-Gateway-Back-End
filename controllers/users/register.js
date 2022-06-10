const httpStatus = require('http-status-codes');
const chalk = require('chalk');

const {transporter, defaultOptions} = require('../../mail/transporter');
const registerUserMiddlewarePipeline = require('../../middleware/users/register');
const User = require('../../data/models/user');
const Verification = require('../../data/models/verification');

const tryRegisterUser = (req, res, next) => {
    const {
        name,
        surname,
        email,
        password,
        organization
    } = req.body;

    User
        .create({
            name,
            surname,
            email,
            password,
            organization
        })
        .then(createdUser => {
            req.user_id = createdUser['doc']['_id'];
            req.email = createdUser['doc']['email'];
            next();
        })
        .catch(err => {
            console.log(chalk.red('error: creating the user:', err.message));
            res.status(httpStatus.CONFLICT)
            next(new Error('error: creating user'));
        })
}


const generateVerificationEntry = (req, res, next) => {
    const {user_id} = req;

    Verification
        .create({
            user_id
        })
        .then(ver => {
            req.ver_id = ver['doc']['_id'];
            next();
        })
        .catch(err => {
            console.log(chalk.red('error: creating verification entry:', err.message));
            next(new Error('error: creating verification entry'));
        })
}


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
        .status(httpStatus.CREATED)
        .json({
            _id: req.user_id,
            message: 'Your account has been created, please verify the account in order to use all functionalities'
        });
}

const registerUser = [
    ...registerUserMiddlewarePipeline,
    tryRegisterUser,
    generateVerificationEntry,
    sendVerificationEmail,
    sendResponse
];

module.exports = registerUser;