const httpStatus = require('http-status-codes');
const log = require('npmlog');

const User = require('../../data/models/user');
const Verification = require('../../data/models/verification');


const requireVerificationData = (req, res, next) => {
    const {verifyId} = req.params;

    if (!verifyId) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Verification identifier is missing'
            });
    }
    req.verifyId = verifyId;
    next();
}

const fetchVerificationById = async (req, res, next) => {
    const {verifyId} = req;
    let ver = undefined;
    try {
        ver = await Verification.findById(verifyId);
    } catch (err) {
        log.log('error', 'VERIFY', 'Error at fetchVerificationById:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: `Error while fetching verification document with id ${verifyId}`
            });
    }
    if (!ver) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Verification with ID ${verifyId} does not exist`
            });
    }
    req.ver = ver['_doc'];
    next();
}



const verifyUserAccount = async (req, res, next) => {
    const update = { status: 'verified' };
    const options = { new: true };
    const {ver} = req;
    let user = undefined;
    try {
        user = await User.findByIdAndUpdate(ver.user_id, update, options).exec();
    } catch (err) {
        log.log('error', 'VERIFY', 'Error at verifyUserAccount:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while verifying user account'
            });
    }
    if (!user) {
        log.log('error', 'VERIFY', 'Error: user with id', ver.user_id, 'does not exist');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Attempt to verify user which does not exist'
            });
    }
    next();
}


const deleteVerification = async (req, res, next) => {
    const {ver} = req;
    try {
        await Verification.findByIdAndDelete(ver._id);
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
    requireVerificationData,
    fetchVerificationById,
    verifyUserAccount,
    deleteVerification,
    sendResponse
];

module.exports = {
    verifyUser,
    // Exporting single functions for testing purposes.
    requireVerificationData,
    fetchVerificationById,
    verifyUserAccount,
    deleteVerification,
    sendResponse
};