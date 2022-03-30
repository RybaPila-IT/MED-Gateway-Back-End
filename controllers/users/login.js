const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const {jwtSecretKey} = require('../../suppliers/constants');

const loginUserMiddlewarePipeline = require('../../middleware/users/login');
const chalk = require("chalk");

const authenticateUserWithToken = (req, res, next) => {
    const jwtSecret = process.env[jwtSecretKey];
    const options = {expiresIn: '2h'};
    const payload = (
        ({_id, status, permission}) => {
            return {_id, status, permission}
        }
    )(req.user);

    jwt.sign(payload, jwtSecret, options, (err, token) => {
        if (err) {
            console.log(chalk.red('error: signing a token:', err.message));
            res.status(httpStatus.INTERNAL_SERVER_ERROR);
            return next(new Error('error: logging in'));
        }
        req['token'] = token;
        req['payload'] = payload;
        next();
    });
}

const updateUserLastLogin = (req, res, next) => {
    const {user: User} = req;
    User
        .updateOne({last_login: Date.now()})
        .then(() => {
            next()
        })
        .catch(err => {
            console.log(chalk.red('error: updating user model', err.message));
            res.statusCode(httpStatus.INTERNAL_SERVER_ERROR);
            next(new Error('error: updating user model'));
        })
}

const sendResponse = (req, res) => {
    const {token, payload} = req;
    res.status(httpStatus.OK).json({
        ...payload,
        token
    });
}

const loginUser = [
    ...loginUserMiddlewarePipeline,
    authenticateUserWithToken,
    updateUserLastLogin,
    sendResponse
];

module.exports = loginUser;