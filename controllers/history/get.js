const httpStatus = require('http-status-codes');
const log = require('npmlog');

const History = require('../../data/models/history');
const {
    userIsVerified
} = require('../../middleware/authenticate');
const {
    requireProductIdInParams
} = require('../products/get');

const fetchHistory = async (req, res, next) => {
    const {productID} = req;
    const {_id: userID} = req.token;
    const filter = {product_id: productID, user_id: userID};
    const update = {};
    const options = {upsert: true, new: true};
    let history = undefined;
    try {
        // Using findOneAndUpdate in order to use upsert option.
        history = await History.findOneAndUpdate(filter, update, options).exec();
    } catch (err) {
        log.log('error', 'GET HISTORY', 'Error at fetchHistory:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: `Internal error while fetching history for product ${productID}`
            });
    }
    req.history = history;
    next();
}

const sendResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            entries: req.history.entries.map(entry => entry['_doc'])
        });
    // Log the success info.
    log.log(
        'info',
        'GET HISTORY',
        'Sent history entries for user',
        req.history.user_id.toString(),
        'of product',
        req.history.product_id.toString()
    )
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
    fetchHistory,
    sendResponse
};