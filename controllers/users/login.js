const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const log = require('npmlog');
const bcrypt = require('bcrypt');

const EnvKeys = require('../../env/keys');
const User = require('../../data/models/user');

const requireLoginData = (req, res, next) => {
    const {email, password} = req.body;
    const userProperties = [
        {prop: email, propName: 'Email'},
        {prop: password, propName: 'Password'}
    ];
    userProperties.forEach(({prop, propName}) => {
        if (!prop) {
            return res
                .status(httpStatus.BAD_REQUEST)
                .json({
                    message: `${propName} was not provided, unable to login`
                });
        }
    });
    req.email = email;
    req.password = password;
    next();
}

const fetchUserModelByEmail = async (req, res, next) => {
    const {email} = req;
    let user = undefined;
    try {
        user = await User.findOne({email});
    } catch (err) {
        log.log('error', 'LOGIN', 'Error in fetchUserModelByEmail:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Error while fetching user model from database'
            });
    }
    // Continue after user fetching.
    if (!user) {
        log.log('info', 'LOGIN', 'Attempt to login with email not present in database; email:', email);
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json({
                message: 'Credentials mismatch'
            });
    }
    // Store the object, not the whole model.
    req.user = user['_doc'];
    next();
}

const verifyUserPassword = async (req, res, next) => {
    const {password: providedPassword} = req;
    const {password: originalPassword} = req.user;

    let match = false;

    try {
        match = await bcrypt.compare(providedPassword, originalPassword);
    } catch (err) {
        log.log('error', 'LOGIN', 'Error in verifyUserPassword:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Error while checking the password'
            });
    }
    // Continue after bcrypt finishes
    if (!match) {
        const {_id, name, surname} = req.user;
        log.log('info', 'LOGIN', 'Invalid credentials for user', name, surname, _id.toString());
        return res
            .status(httpStatus.UNAUTHORIZED)
            .json({
                message: 'Credentials mismatch'
            });
    }
    next();
}


const createToken = (req, res, next) => {
    const jwtSecret = process.env[EnvKeys.jwtSecret];
    const options = {expiresIn: '2h'};
    const payload = (
        ({_id, status, permission}) => {
            return {_id, status, permission}
        }
    )(req.user);

    jwt.sign(payload, jwtSecret, options, (err, token) => {
        if (err) {
            log.log('error', 'LOGIN', 'Error in createToken:', err.message);
            return res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Error while creating the token for user'
                });
        }
        req.token = token;
        next();
    });
}

const sendResponse = (req, res) => {
    const {token} = req;
    res
        .status(httpStatus.OK)
        .json({
            token
        });
}

const loginUser = [
    requireLoginData,
    fetchUserModelByEmail,
    verifyUserPassword,
    createToken,
    sendResponse
];

module.exports = {
    loginUser,
    // Exporting single functions for testing purposes.
    requireLoginData,
    fetchUserModelByEmail,
    verifyUserPassword,
    createToken,
    sendResponse
};