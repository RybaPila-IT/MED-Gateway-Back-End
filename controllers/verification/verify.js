const httpStatus = require('http-status-codes');
const chalk = require('chalk');
const {verificationMiddlewarePipeline} = require('../../middleware/verification/verify');
const User = require('../../data/models/user');

const verifyUserAccount = (req, res, next) => {
    const update = { status: 'verified' };
    const options = { new: true };
    const {verification} = req;

    User
        .findByIdAndUpdate(verification.user_id, update, options)
        .then(userDoc => {
            if (!userDoc) {
                throw new Error(`user with id ${verification.user_id} does not exist`);
            }
            next();
        })
        .catch(err => {
            console.log(chalk.red(`error: updating user with id ${verification.user_id}`, err.message));
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `error while updating user model: ${err.message}`
                });
        })
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            message: 'Your account has been successfully verified!'
        });
}

const verifyUser = [
    verificationMiddlewarePipeline,
    verifyUserAccount,
    sendResponse
];

module.exports = {
    verifyUser
};