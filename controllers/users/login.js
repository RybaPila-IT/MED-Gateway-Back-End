const httpStatus = require('http-status-codes');

const loginUserMiddlewarePipeline = require('../../middleware/users/login');

const authenticateUser = (req, res) => {
    res.status(httpStatus.OK).json({message: 'OK'});
}

const loginUser = [
    ...loginUserMiddlewarePipeline,
    authenticateUser
];

module.exports = loginUser;