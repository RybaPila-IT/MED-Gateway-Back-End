const httpStatus = require('http-status-codes');
const log = require('npmlog');

const History = require('../../data/models/history');
const {
    userIsVerified
} = require('../../middleware/authenticate');


const requireProductIdInParams = (req, res, next) => {
    const {productId} = req.params;
    if (!productId) {
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Unable to fetch history for product since productID is missing'
            });
    }
    next();
}

// TODO (radek.r) Move it to separate file in order to reduce duplication.
// TODO (radek.r) Think about where the middlewares and controller functions should be stored.
const fetchUserHistory = (req, res, next) => {
    const {productId} = req.params;
    const {_id: userId} = req.token;

    History
        .findOne({product_id: productId, user_id: userId})
        .then(doc => {
            if (doc) {
                // If the history already exists just set it into request.
                req.history = doc;
                // Continue the pipeline.
                return next();
            }
            History
                .create({
                    product_id: productId,
                    user_id: userId,
                })
                .then(doc => {
                    // Set the history object in the request.
                    req.history = doc;
                    // Continue the pipeline.
                    next();
                })
                .catch(err => {
                    res
                        .status(httpStatus.INTERNAL_SERVER_ERROR)
                        .json({
                            message: `Create history for product ${productId}: ${err.message}`
                        });
                })
        })
        .catch(err => {
            res
                .status(httpStatus.INTERNAL_SERVER_ERROR)
                .json({
                    message: `Find history for product ${productId}: ${err.message}`
                });
        });
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            entries: req.history.entries
        });
}


const getHistory = [
    ...userIsVerified,
    requireProductIdInParams,
    fetchUserHistory,
    sendResponse
];


module.exports = {
    getHistory,
    // Export single functions for testing
    requireProductIdInParams,
    fetchUserHistory,
    sendResponse
};