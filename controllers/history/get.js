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
    req.product_id = productId;
    next();
}

const fetchHistory = async (req, res, next) => {
    const {product_id} = req;
    const {_id: user_id} = req.token;
    const filter = {product_id, user_id};
    const update = {};
    const options = {upsert: true, new: true};
    let historyDoc = undefined;
    try {
        // Using findOneAndUpdate in order to use upsert option.
        historyDoc = await History.findOneAndUpdate(filter, update, options).exec();
    } catch (err) {
        log.log('error', 'GET HISTORY', 'Error at fetchHistory:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: `Internal error while fetching history for product ${product_id}`
            });
    }
    req.history_doc = historyDoc;
    next();
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
    fetchHistory,
    sendResponse
];


module.exports = {
    getHistory,
    // Export single functions for testing
    requireProductIdInParams,
    fetchHistory,
    sendResponse
};