const httpStatus = require('http-status-codes');
const log = require('npmlog');
const mongoose = require('mongoose');

const Product = require('../../data/models/product');

const requireProductId = (req, res, next) => {
    const {productId} = req.params;
    if (!productId) {
        log.log('info', 'GET PRODUCT', 'missing product ID in request parameters');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Missing product id in request parameters'
            });
    }
    next();
}

const validProductId = (req, res, next) => {
    const {productId} = req.params;
    const objId = new mongoose.Types.ObjectId(productId);
    if (objId.toString() !== productId) {
        log.log('info', 'GET PRODUCT', 'provided product ID is invalid; productId:', productId);
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: 'Provided product identifier is invalid'
            });
    }
    next();
}

const getProductData = async (req, res) => {
    const {productId} = req.params;
    const projection = {
        created_at: 0,
        updated_at: 0,
        __v: 0
    };
    let product = undefined;
    try {
        product = await Product.findById(productId, projection);
    } catch (err) {
        log.log('error', 'GET PRODUCT', 'Error at getProductData:', err.message);
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({
                message: 'Internal error while fetching product data'
            });
    }
    if (!product) {
        log.log('info', 'GET PRODUCT', 'Searched for product with id', productId, 'but it does not exist');
        return res
            .status(httpStatus.BAD_REQUEST)
            .json({
                message: `Product with id ${productId} does not exist`
            });
    }
    // Make response with product data.
    return res
        .status(httpStatus.OK)
        .json({
            ...product['_doc']
        });
}

const getAllProductsSummary = async (req, res) => {
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
    return res
        .status(httpStatus.OK)
        .json(
            products.map(product => product['_doc'])
        );
}

const getProduct = [
    requireProductId,
    validProductId,
    getProductData
];

const getProductsSummary = [
    getAllProductsSummary
];

module.exports = {
    getProductsSummary,
    getProduct,
    // Export single functions for testing purposes.
    requireProductId,
    validProductId,
    getProductData,
    getAllProductsSummary
};