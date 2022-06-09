const {getHistoryMiddlewarePipeline} = require('../../middleware/history/get');
const History = require('../../data/models/history');
const httpStatus = require('http-status-codes');


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

const generateResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            entries: req.history.entries
        });
}


const getHistory = [
    ...getHistoryMiddlewarePipeline,
    fetchUserHistory,
    generateResponse
];


module.exports = {
    getHistory
};