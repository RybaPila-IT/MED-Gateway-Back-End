const httpStatus = require('http-status-codes');
const log = require('npmlog');

const Product = require('../../data/models/product');
const {validID} = require('../../middleware/check');

const requireProductIdInParams = (req, res, next) => {
    const {productID} = req.params;
    if (!productID) {
        log.log('info', 'GET PRODUCT', 'Missing product ID in request parameters');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Missing product ID in request parameters'
            });
    }
    if (!validID(productID)) {
        log.log('info', 'GET PRODUCT', 'Provided ID', productID, 'is invalid');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Provided product ID ${productID} is invalid`
            });
    }
    req.productID = productID;
    next();
}


const fetchProduct = async (req, res, next) => {
    const {productID} = req;
    const projection = {
        created_at: 0,
        updated_at: 0,
        __v: 0
    };
    let product = undefined;
    try {
        product = await Product.findById(productID, projection);
    } catch (err) {
        log.log('error', 'GET PRODUCT', 'Error at getProductData:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while fetching product data'
            });
    }
    if (!product) {
        log.log('info', 'GET PRODUCT', 'Searched for product with id', productID, 'but it does not exist');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Product with id ${productID} does not exist`
            });
    }
    req.product = product;
    next();
}

const sendSingleProductResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            ...req.product['_doc']
        });
}

const fetchProductsSummary = async (req, res, next) => {
    const filter = {}
    const projection = {
        name: 1,
        photo_url: 1,
        short_description: 1,
        is_active: 1
    }
    let products = [];
    try {
        products = await Product.find(filter, projection).exec();
    } catch (err) {
        log.log('error', 'GET PRODUCTS', 'Error at getAllProductsSummary:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while fetching list of available products'
            });
    }
    req.products = products;
    next();
}

const sendProductsSummaryResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json(
            req.products.map(product => product['_doc'])
        );
    // Final logging
    log.log('info', 'GET PRODUCTS SUMMARY', 'Products summary has been sent successfully');
}

const getProduct = [
    requireProductIdInParams,
    fetchProduct,
    sendSingleProductResponse
];

const getProductsSummary = [
    fetchProductsSummary,
    sendProductsSummaryResponse
];

module.exports = {
    getProductsSummary,
    getProduct,
    // Export single functions for testing purposes.
    requireProductIdInParams,
    fetchProduct,
    sendSingleProductResponse,
    fetchProductsSummary,
    sendProductsSummaryResponse
};