const httpStatus = require('http-status-codes');
const log = require('npmlog');

const User = require('../../data/models/user');
const {
    userIsAuthenticated
} = require('../../middleware/authenticate');

const getUserData = async (req, res, next) => {
    const {_id: userID} = req.token;
    const projection = {
        password: 0,
        registered_at: 0,
        updated_at: 0,
        last_login: 0,
        __v: 0
    };
    let user = undefined;
    try {
        user = await User.findById(userID, projection);
    } catch (err) {
        log.log('error', 'GET USER', 'Error at getUserData:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while collecting user data'
            });
    }
    if (!user) {
        log.log('warning', 'GET USER', 'Obtained token with user id', userID, 'which was not found in database');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Obtained invalid token'
            });
    }
    req.user = user;
    next();
}


const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            ...req.user['_doc']
        });
    // Result log.
    log.log(
        'info', 'GET USER', 'Sent personal information about',
        req.user.name, req.user.surname, req.user._id.toString()
    );
}

const getUser = [
    ...userIsAuthenticated,
    getUserData,
    sendResponse
];

module.exports = {
    getUser,
    // Export single functions for testing purposes.
    getUserData,
    sendResponse
};