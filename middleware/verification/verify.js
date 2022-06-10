const httpStatus = require('http-status-codes');
const chalk = require('chalk');
const Verification = require('../../data/models/verification');


const verificationIdPresent = (req, res, next) => {
    const {verifyId} = req.params;

    if (verifyId) {
        return next();
    }

    res
        .status(httpStatus.BAD_REQUEST)
        .json({
            message: 'Verification identifier is missing'
        });
}

const fetchVerification = (req, res, next) => {
    const {verifyId} = req.params;

    Verification
        .findById(verifyId)
        .then(verifyDoc => {
            if (!verifyDoc) {
                throw new Error(`verification with id ${verifyId} does not exist`);
            }
            req.verification = verifyDoc['_doc'];
            next();
        })
        .catch(err => {
            console.log(chalk.red('error: fetching verification document:', err.message));
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `error while fetching verification document with id ${verifyId}`
                });
        })
}

const verificationMiddlewarePipeline = [
    verificationIdPresent,
    fetchVerification
];

module.exports = {
    verificationMiddlewarePipeline
}