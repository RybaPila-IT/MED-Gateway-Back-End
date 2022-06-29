const httpStatus = require('http-status-codes');
const log = require('npmlog');

const User = require('../../data/models/user');
const Verification = require('../../data/models/verification');
const {validID} = require('../../middleware/check');

const requireVerificationIdInParams = (req, res, next) => {
    const {verifyID} = req.params;
    if (!verifyID) {
        log.log('info', 'VERIFY', 'Missing verification ID');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Verification identifier is missing'
            });
    }
    if (!validID(verifyID)) {
        log.log('info', 'VERIFY', 'Provided verification ID', verifyID, 'is incorrect');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Provided verification ID ${verifyID} is invalid`
            });
    }
    req.context.verifyID = verifyID;
    next();
}

const fetchVerificationById = async (req, res, next) => {
    const {verifyID} = req.context;
    let ver = undefined;
    try {
        ver = await Verification.findById(verifyID);
    } catch (err) {
        log.log('error', 'VERIFY', 'Error at fetchVerificationById:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: `Error while fetching verification document with ID ${verifyID}`
            });
    }
    if (!ver) {
        log.log('info', 'VERIFY', 'Unable to fetch verification with ID', verifyID, 'since it does not exist');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Verification with ID ${verifyID} does not exist`
            });
    }
    req.context.verification = ver;
    next();
}


const verifyUserAccount = async (req, res, next) => {
    const {verification} = req.context;
    const update = { status: 'verified' };
    const options = { new: true };
    let user = undefined;
    try {
        user = await User.findByIdAndUpdate(verification.user_id, update, options).exec();
    } catch (err) {
        log.log('error', 'VERIFY', 'Error at verifyUserAccount:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while verifying user account'
            });
    }
    if (!user) {
        log.log('error', 'VERIFY', 'Error: user with id', verification.user_id, 'does not exist');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Attempt to verify user which does not exist'
            });
    }
    log.log('info', 'VERIFY', 'User with ID', user._id.toString(), 'has been verified');
    next();
}


const deleteVerification = async (req, res, next) => {
    const {verification} = req.context;
    try {
        await verification.delete();
    } catch (err) {
        log.log('error', 'VERIFY', 'Error at deleteVerification', err.message);
    }
    // We do not want to break the pipeline here, since deleting this entry is not mandatory.
    next();
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            message: 'Your account has been successfully verified!'
        });
}

const verifyUser = [
    requireVerificationIdInParams,
    fetchVerificationById,
    verifyUserAccount,
    deleteVerification,
    sendResponse
];

module.exports = {
    verifyUser,
    // Exporting single functions for testing purposes.
    requireVerificationIdInParams,
    fetchVerificationById,
    verifyUserAccount,
    deleteVerification,
    sendResponse
};