const httpStatus = require('http-status-codes');
const log = require('npmlog');

const History = require('../../data/models/history');
const {userIsVerified} = require('../../middleware/authenticate');
const {requireProductIdInParams} = require('../products/get');

const fetchHistory = async (req, res, next) => {
    const {productID, token} = req.context;
    const {_id: userID} = token;
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
    req.context.history = history;
    next();
}

const sendResponse = (req, res) => {
    const {history} = req.context;
    res
        .status(httpStatus.OK)
        .json({
            entries: history.entries.map(entry => entry['_doc'])
        });
    // Log the success info.
    log.log(
        'info',
        'GET HISTORY',
        'Sent history entries for user',
        history.user_id.toString(),
        'of product',
        history.product_id.toString()
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