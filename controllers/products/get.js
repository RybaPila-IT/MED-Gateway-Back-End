const httpStatus = require('http-status-codes');
const chalk = require("chalk");

const Product = require('../../data/models/product');
const {
    getSingleProductMiddlewarePipeline,
    getProductsSummaryMiddlewarePipeline
} = require('../../middleware/products/get');

const getProductData = (req, res, next) => {
    const {productId} = req.params;
    const projection = {
        created_at: 0,
        updated_at: 0,
        __v: 0
    };
    Product
        .findById(productId, projection)
        .then(product => {
            if (!product) {
                return res
                    .status(httpStatus.BAD_REQUEST)
                    .json({
                        'message': `product with id ${productId} does not exist`
                    })
            }
            // If product is valid, make response.
            res
                .status(httpStatus.OK)
                .json({
                    ...product['_doc']
                });
        })
        .catch(err => {
            console.log(chalk.red('error while looking for product with id', productId, ':', err.message));
            return next(new Error(`error: unable to fetch data for product with id ${productId}`));
        })
}

const getAllProductsSummary = (req, res, next) => {
    const filter = {}
    const projection = {
        name: 1,
        picture: 1,
        short_description: 1,
        is_active: 1
    }
    const options = {}
    Product
        .find(filter, projection, options)
        .then(products => {
            // Select only document data for the front-end part.
            const productsResponse = products.map(product => product['_doc']);

            res
                .status(httpStatus.OK)
                .json(productsResponse);
        })
        .catch(err => {
            console.log(chalk.red('error: collecting products information', err.message));
            return next(new Error('error: internal error while retrieving list of available products'));
        })

}

const getProduct = [
    ...getSingleProductMiddlewarePipeline,
    getProductData
];

const getProductsSummary = [
    ...getProductsSummaryMiddlewarePipeline,
    getAllProductsSummary
]

module.exports = {
    getProductsSummary,
    getProduct
};