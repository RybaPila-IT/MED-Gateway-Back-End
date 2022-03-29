const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const chalk = require("chalk");
const {jwtSecretKey} = require('../../suppliers/constants')

const setResponseToNotFound = (req, res, next) => {
    res.status(httpStatus.NOT_FOUND);
    return next(new Error('Page not found'));
}

const requireBearerAuthorization = (req, res, next) => {
    if (!req.headers.authorization) {
        console.log(chalk.yellow('warning: attempt to enter protected route without authorization'));
        return setResponseToNotFound(req, res, next);
    }
    if (!req.headers.authorization.startsWith('Bearer')) {
        console.log(chalk.yellow('warning: wrong authorization method'));
        return setResponseToNotFound(req, res, next);
    }
    next();
}

const verifyUserToken = (req, res, next) => {
    // Hacky solution: Authorization string is in the form 'Bearer Token'.
    // We split the string by an empty space and grab the second
    // element from received array to fetch the 'Token'.
    // At index 0, there is just the text 'Bearer'.
    const token = req.headers.authorization.split(' ')[1];
    const jwtSecret = process.env[jwtSecretKey];
    jwt.verify(token, jwtSecret, {}, (err, decoded) => {
        if (err) {
            console.log(chalk.red('error: verifying the jwt:', err.message));
            return setResponseToNotFound(req, res, next);
        }
        req['token'] = decoded;
        next();
    });
}

const authenticateUserMiddlewarePipeline = [
    requireBearerAuthorization,
    verifyUserToken
];

module.exports = authenticateUserMiddlewarePipeline;