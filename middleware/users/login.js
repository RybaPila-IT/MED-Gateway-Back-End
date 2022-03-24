const httpStatus = require("http-status-codes");
const chalk = require("chalk");
const bcrypt = require('bcrypt');
const User = require('../../data/models/user');

const ensureUserLoginDataIsPresent = (req, res, next) => {
    const {email, password} = req.body;
    const userProperties = [
        {prop: email, propName: 'email'},
        {prop: password, propName: 'password'}
    ]
    userProperties.forEach(({prop, propName}) => {
        if (!prop) {
            res.status(httpStatus.BAD_REQUEST);
            throw new Error(`error: user ${propName} property is not specified`);
        }
    })
    next();
}

const fetchUserModel = (req, res, next) => {
    const {email} = req.body;
    User.findOne({email}, (err, user) => {
        if (err) {
            console.log(chalk.red('error: fetching user model:', err.message));
            res.status(httpStatus.BAD_REQUEST);
            return next(new Error('error: fetching user model'));
        }
        if (!user) {
            console.log(chalk.yellow('warning: user not found; email:', email));
            res.status(httpStatus.UNAUTHORIZED);
            return next(new Error('error: user with provided email does not exist'));
        }
        req['user'] = user;
        next();
    })
}

const verifyUserPassword = (req, res, next) => {
    const {password} = req.body;
    const hashedPassword = req.user.password;
    bcrypt.compare(password, hashedPassword, (err, match) => {
        if (err) {
            console.log(chalk.red('error: bcrypt compare passwords:', err.message));
            return next(new Error('error: comparing passwords'));
        }
        if (!match) {
            console.log(chalk.yellow('warning: supplied wrong credentials for user', req.user._id));
            res.status(httpStatus.UNAUTHORIZED);
            return next(new Error('credentials mismatch'));
        }
        next();
    })
}


const loginUserMiddlewarePipeline = [
    ensureUserLoginDataIsPresent,
    fetchUserModel,
    verifyUserPassword
];

module.exports = loginUserMiddlewarePipeline;