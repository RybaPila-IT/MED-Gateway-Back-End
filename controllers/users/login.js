const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');

const loginUserMiddlewarePipeline = require('../../middleware/users/login');
const chalk = require("chalk");

const jwtSecretKey = 'JWT_SECRET';

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
            return next(new Error('error: logging in'));
        }
        res.status(httpStatus.OK).json({
            ...payload,
            token
        });
    });
}

const loginUser = [
    ...loginUserMiddlewarePipeline,
    authenticateUserWithToken
];

module.exports = loginUser;