const httpStatus = require("http-status-codes");
const bcrypt = require("bcrypt");
const chalk = require("chalk");

const ensureUserRegistrationDataIsPresent = (req, res, next) => {
    const {name, surname, email, password, organization} = req.body;
    const userProperties = [
        {prop: name, propName: 'name'},
        {prop: surname, propName: 'surname'},
        {prop: email, propName: 'email'},
        {prop: password, propName: 'password'},
        {prop: organization, propName: 'organization'},
    ];
    userProperties.forEach(({prop, propName}) => {
        if (!prop) {
            res.status(httpStatus.BAD_REQUEST);
            throw new Error(`error: user ${propName} property is not specified`);
        }
    })
    next();
}

const hashUserPassword = (req, res, next) => {
    const genSaltRounds = 10;
    const {password} = req.body;

    const setEncryptedPassword = (encrypted) => {
        req.body['password'] = encrypted;
    }

    const hashPassword = (password, salt) => {
        bcrypt.hash(password, salt, (err, encrypted) => {
            if (err) {
                console.log(chalk.red('error: encrypting user password:', err.message));
                next(new Error('error: encrypting user password'));
            }
            setEncryptedPassword(encrypted);
            next();
        })
    }

    bcrypt.genSalt(genSaltRounds, (err, salt) => {
        if (err) {
            console.log(chalk.red('error: generating salt:', err.message));
            return next(new Error('error: generating salt'));
        }
        hashPassword(password, salt);
    })
}

const registerUserMiddlewarePipeline = [
    ensureUserRegistrationDataIsPresent,
    hashUserPassword
];

module.exports = registerUserMiddlewarePipeline;