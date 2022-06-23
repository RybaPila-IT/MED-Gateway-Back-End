const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const log = require('npmlog');
const EnvKeys = require('../env/keys');

const requireBearerAuthorization = (req, res, next) => {
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
        return res
            .status(httpStatus.NOT_FOUND)
            .json({
                message: 'Page not found'
            });
    }
    next();
}

const verifyUserToken = (req, res, next) => {
    // Hacky solution: Authorization string is in the form 'Bearer Token'.
    // We split the string by an empty space and grab the second
    // element from received array to fetch the 'Token'.
    // At index 0, there is just the text 'Bearer'.
    const token = req.headers.authorization.split(' ')[1];
    const jwtSecret = process.env[EnvKeys.jwtSecret];
    jwt.verify(token, jwtSecret, {}, (err, decoded) => {
        if (err) {
            log.log('error', 'AUTH', 'Verifying the jwt:', err.message);
            return res
                .status(httpStatus.NOT_FOUND)
                .json({
                    message: 'Page not found'
                });
        }
        req.token = decoded;
        next();
    });
}


const verifyUserStatus = (req, res, next) => {
    const verifiedStatus = 'verified';
    const {status} = req.token;

    if (status !== verifiedStatus) {
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json({
                message: 'Your account is not verified, please verify your account'
            });
    }
    next();
}


const userIsAuthenticated = [
    requireBearerAuthorization,
    verifyUserToken
];

const userIsVerified = [
    requireBearerAuthorization,
    verifyUserToken,
    verifyUserStatus
];

module.exports = {
    userIsAuthenticated,
    userIsVerified,
    // Exporting single functions for testing purposes.
    requireBearerAuthorization,
    verifyUserToken,
    verifyUserStatus
};