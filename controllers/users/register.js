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
    userProperties.forEach(({prop, propName}) => {
        if (!prop) {
            return res
                .status(httpStatus.BAD_REQUEST)
                .json({
                    message: `${propName} was not provided but is necessary to register the user`
                });
        }
    })
    next();
}

const genSalt = (req, res, next) => {
    const genSaltRounds = 10;
    bcrypt.genSalt(genSaltRounds, (err, salt) => {
        if (err) {
            log.log('error', 'REGISTER', 'Error in genSalt:', err.message);
            return res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Error while protecting user password'
                })
        }
        req.salt = salt;
        next();
    })
}

const hashPassword = (req, res, next) => {
    const {password} = req.body;
    const {salt} = req;
    bcrypt.hash(password, salt, (err, encrypted) => {
        if (err) {
            log.log('error', 'REGISTER', 'Error in hashPassword:', err.message);
            return res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Error while protecting user password'
                })
        }
        req.body.password = encrypted;
        next();
    })
}

const createUser = (req, res, next) => {
    const {name, surname, email, password, organization} = req.body;
    User
        .create({name, surname, email, password, organization})
        .then(user => {
            req.user = user['_doc'];
            next();
        })
        .catch(err => {
            if (err instanceof DuplicateKeyError) {
                log.log('error', 'REGISTER', 'Registered user will cause a duplication; error:', err.message);
                return res
                    .status(httpStatus.CONFLICT)
                    .message({
                        message: `Unable to register: ${err.message}`
                    });
            }
            log.log('error', 'REGISTER', 'Error at tryRegisterUser:', err.message);
            return res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .message({
                    message: 'Unable to register user due to internal error'
                });
        })
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.CREATED)
        .json({
            message: 'Your account has been created, please verify the account in order to use all functionalities'
        });
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

module.exports = registerUser;