const httpStatus = require('http-status-codes');
const chalk = require("chalk");

const User = require('../../data/models/user');
const authenticateUserMiddlewarePipeline = require('../../middleware/users/authenticate');

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
            res
                .status(httpStatus.OK)
                .json({
                    ...user['_doc']
                });
        })
        .catch(err => {
            console.log(chalk.red('error: fetching user model with valid token', err.message));
            res.statusCode(httpStatus.INTERNAL_SERVER_ERROR);
            return next(new Error('error: login attempt performed with valid token failed'));
        })
}

const getUser = [
    ...authenticateUserMiddlewarePipeline,
    getUserData
];

module.exports = getUser;