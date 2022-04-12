const chalk = require('chalk');
const httpStatus = require('http-status-codes');

const isProductIdPresent = (req, res, next) => {
    const {productId} = req.params;
    if (!productId) {
        console.log(chalk.yellow('get product info: missing product id'));
        res.status(httpStatus.BAD_REQUEST);
        return next(new Error('error: missing product id in request parameters'));
    }
    return next();
}

const getSingleProductMiddlewarePipeline = [
    isProductIdPresent
]

// This pipeline is empty but is created in order
// to keep programming consistency.
const getProductsSummaryMiddlewarePipeline = [];

module.exports = {
    getSingleProductMiddlewarePipeline,
    getProductsSummaryMiddlewarePipeline
}