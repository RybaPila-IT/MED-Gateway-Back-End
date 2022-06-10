const httpStatus = require('http-status-codes');

const User = require('../../data/models/user');
const chalk = require("chalk");

const checkIfEmailIsPresent = (req, res, next) => {
    const {email} = req.body;

    if (email) {
        req.email = email;
        return next();
    }

    res
        .status(httpStatus.BAD_REQUEST)
        .json({
            message: 'email is missing'
        });
}

// TODO (radek.r) Remove this duplicate placed in register pipeline.
const fetchUserModel = (req, res, next) => {
    const {email} = req;

    User
        .findOne({email})
        .then(user => {
            if (user) {
                req.user = user['_doc'];
                return next();
            }
            res
                .status(httpStatus.BAD_REQUEST)
                .json({
                    message: `user with email ${email} does not exist`
                });
        })
        .catch(err => {
            console.log(chalk.red('error: fetching user model', err.message));
        })
}

const resendMiddlewarePipeline = [
    checkIfEmailIsPresent,
    fetchUserModel
];

module.exports = {
    resendMiddlewarePipeline
};