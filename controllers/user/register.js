const httpStatus = require('http-status-codes');
const bcrypt = require('bcrypt');
const log = require('npmlog');

const User = require('../../data/models/user');
const {
    DuplicateKeyError
} = require('../../data/schemas/error');
const {
    createVerification,
    sendVerificationEmail
} = require('../verification/send')


const requireRegisterData = (req, res, next) => {
    const {name, surname, email, password, organization} = req.body;
    const userProperties = [
        {prop: name, propName: 'Name'},
        {prop: surname, propName: 'Surname'},
        {prop: email, propName: 'Email'},
        {prop: password, propName: 'Password'},
        {prop: organization, propName: 'Organization'},
    ];
    for (const item of userProperties) {
        if (!item.prop) {
            return res
                .status(httpStatus.BAD_REQUEST)
                .json({
                    message: `${item.propName} was not provided but is necessary to register the user`
                });
        }
    }
    next();
}

const genSalt = async (req, res, next) => {
    const genSaltRounds = 10;
    let salt = undefined;
    try {
        salt = await bcrypt.genSalt(genSaltRounds);
    } catch (err) {
        log.log('error', 'REGISTER', 'Error in genSalt:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Error while protecting user password'
            });
    }
    req.salt = salt;
    next();
}

const hashPassword = async (req, res, next) => {
    const {password} = req.body;
    const {salt} = req;
    try {
        req.body.password = await bcrypt.hash(password, salt);
    } catch (err) {
        log.log('error', 'REGISTER', 'Error in hashPassword:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Error while protecting user password'
            });
    }
    next();
}

const createUser = async (req, res, next) => {
    const {name, surname, email, password, organization} = req.body;
    let user = undefined;
    try {
        user = await User.create({name, surname, email, password, organization});
    } catch (err) {
        if (err instanceof DuplicateKeyError) {
            log.log('error', 'REGISTER', 'Registered user will cause a duplication; error:', err.message);
            return res
                .status(httpStatus.CONFLICT)
                .json({
                    message: 'Provided email address is already in use!'
                });
        }
        log.log('error', 'REGISTER', 'Error at tryRegisterUser:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Unable to register user due to internal error'
            });
    }
    req.user = user;
    next();
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.CREATED)
        .json({
            message: 'Your account has been created, please verify the account in order to use all functionalities'
        });
    // Response logging
    log.log(
        'info', 'REGISTER', 'Registration of user',
        req.body.name, req.body.surname, 'went successfully'
    );
}

const registerUser = [
    requireRegisterData,
    genSalt,
    hashPassword,
    createUser,
    createVerification,
    sendVerificationEmail,
    sendResponse
];

module.exports = {
    registerUser,
    // Export single functions for testing purposes.
    requireRegisterData,
    genSalt,
    hashPassword,
    createUser,
    sendResponse
};