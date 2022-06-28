const httpStatus = require('http-status-codes');
const log = require('npmlog');

const Product = require('../../data/models/product');
const {validID} = require('../../middleware/check');

const requireProductIdInParams = (req, res, next) => {
    const {productId} = req.params;
    if (!productId) {
        log.log('info', 'GET PRODUCT', 'Missing product ID in request parameters');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Missing product ID in request parameters'
            });
    }
    if (!validID(productId)) {
        log.log('info', 'GET PRODUCT', 'Provided ID', productId, 'is invalid');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Provided product ID ${productId} is invalid`
            });
    }
    req.product_id = productId;
    next();
}


const fetchProduct = async (req, res, next) => {
    const {product_id} = req;
    const projection = {
        created_at: 0,
        updated_at: 0,
        __v: 0
    };
    let productDoc = undefined;
    try {
        productDoc = await Product.findById(product_id, projection);
    } catch (err) {
        log.log('error', 'GET PRODUCT', 'Error at getProductData:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while fetching product data'
            });
    }
    if (!productDoc) {
        log.log('info', 'GET PRODUCT', 'Searched for product with id', product_id, 'but it does not exist');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Product with id ${product_id} does not exist`
            });
    }
    req.product_doc = productDoc;
    next();
}

const sendSingleProductResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json({
            ...req.product_doc['_doc']
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
    let productsDocs = [];
    try {
        productsDocs = await Product.find(filter, projection).exec();
    } catch (err) {
        log.log('error', 'GET PRODUCTS', 'Error at getAllProductsSummary:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while fetching list of available products'
            });
    }
    req.products_docs = productsDocs;
    next();
}

const sendProductsSummaryResponse = (req, res) => {
    res
        .status(httpStatus.OK)
        .json(
            req.products_docs.map(product => product['_doc'])
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