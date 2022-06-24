const httpStatus = require('http-status-codes');
const log = require('npmlog');

const User = require('../../data/models/user');
const {
    userIsAuthenticated
} = require('../../middleware/authenticate');

const getUserData = (req, res, next) => {
    const {_id} = req.token;
    const projection = {
        password: 0,
        registered_at: 0,
        updated_at: 0,
        last_login: 0,
        __v: 0
    };

    User
        .findById(_id, projection)
        .then(user => {
            if (!user) {
                log.log('warning', 'GET USER', 'Obtained token with user id', _id, 'which was not found in database');
                return res
                    .status(httpStatus.BAD_REQUEST)
                    .json({
                        message: ''
                    })
            }
            req.user = user['_doc'];
            next();
        })
        .catch(err => {
            log.log('error', 'GET USER', 'Error at getUserData:', err.message);
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: 'Internal error while collecting user data'
                });
        })
}


const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            ...req.user
        });
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