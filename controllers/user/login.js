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
    for (const item of userProperties) {
        if (!item.prop) {
            return res
                .status(httpStatus.BAD_REQUEST)
                .json({
                    message: `${item.propName} was not provided, unable to login`
                });
        }
    }
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
                message: `User with email ${email} does not exist`
            });
    }
    req.user = user;
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
    if (!match) {
        const {_id: userID, name, surname} = req.user;
        log.log('info', 'LOGIN', 'Invalid credentials for user', name, surname, userID.toString());
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
        ({_id, status}) => {
            return {_id, status}
        }
    )(req.user);
    let token = undefined;
    try {
        token = jwt.sign(payload, jwtSecret, options);
    } catch (err) {
        log.log('error', 'LOGIN', 'Error in createToken:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Error while creating the token for user'
            });
    }
    req.token = token;
    next();
}

const sendResponse = (req, res) => {
    const {token} = req;
    res
        .status(httpStatus.OK)
        .json({
            token
        });
    // Log for finishing action.
    log.log('info', 'LOGIN', 'User', req.user.name, req.user.surname, req.user._id.toString(), 'logged in successfully');
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