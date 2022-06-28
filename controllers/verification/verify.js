const httpStatus = require('http-status-codes');
const log = require('npmlog');

const User = require('../../data/models/user');
const Verification = require('../../data/models/verification');
const {validID} = require('../../middleware/check');

const requireVerificationIdInParams = (req, res, next) => {
    const {verifyId} = req.params;

    if (!verifyId) {
        log.log('info', 'VERIFY', 'Missing verification ID');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Verification identifier is missing'
            });
    }
    if (!validID(verifyId)) {
        log.log('info', 'VERIFY', 'Provided verification ID', verifyId, 'is incorrect');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Provided verification ID ${verifyId} is invalid`
            });
    }
    req.verify_id = verifyId;
    next();
}

const fetchVerificationById = async (req, res, next) => {
    const {verify_id} = req;
    let ver = undefined;
    try {
        ver = await Verification.findById(verify_id);
    } catch (err) {
        log.log('error', 'VERIFY', 'Error at fetchVerificationById:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: `Error while fetching verification document with ID ${verify_id}`
            });
    }
    if (!ver) {
        log.log('info', 'VERIFY', 'Unable to fetch verification with ID', verify_id, 'since it does not exist');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Verification with ID ${verify_id} does not exist`
            });
    }
    req.ver_doc = ver;
    next();
}



const verifyUserAccount = async (req, res, next) => {
    const update = { status: 'verified' };
    const options = { new: true };
    const {ver_doc} = req;
    let user = undefined;
    try {
        user = await User.findByIdAndUpdate(ver_doc.user_id, update, options).exec();
    } catch (err) {
        log.log('error', 'VERIFY', 'Error at verifyUserAccount:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while verifying user account'
            });
    }
    if (!user) {
        log.log('error', 'VERIFY', 'Error: user with id', ver_doc.user_id, 'does not exist');
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
    const {ver_doc} = req;
    try {
        await ver_doc.delete();
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