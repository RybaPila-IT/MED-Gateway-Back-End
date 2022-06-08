const httpStatus = require('http-status-codes')
const chalk = require("chalk");

const Product = require('../../data/models/product')
const authenticateUserMiddlewarePipeline = require('../../middleware/users/authenticate');
const {isProductIdPresent} = require('./get');

const checkIfProductExists = (req, res, next) => {
    const {productId} = req.params;

    Product
        .findById(productId)
        .then(product => {
            if (!product) {
                return res
                    .status(httpStatus.BAD_REQUEST)
                    .json({
                        'message': `product with id ${productId} does not exist`
                    });
            }
            // Everything is fine, call next middleware.
            next()
        })
        .catch((err) => {
            console.log(chalk.red('error while looking for product with id', productId, ':', err.message));
            return next(new Error(`error: unable to fetch data for product with id ${productId}`));
        })
}

const ensurePredictionPropertiesArePresent = (req, res, next) => {
    const {
        patient_name,
        patient_surname,
        description,
        data
    } = req.body;
    const predictionRequestProperties = [
        {prop: patient_name, propName: 'patient_name'},
        {prop: patient_surname, propName: 'patient_surname'},
        {prop: description, propName: 'description'},
        {prop: data, propName: 'data'},
    ];
    predictionRequestProperties.forEach(({prop, propName}) => {
        if (!prop) {
            res.status(httpStatus.BAD_REQUEST);
            throw new Error(`error: property ${propName} for prediction is not specified`);
        }
    })
    next();
}

const useProductMiddlewarePipeline = [
    ...authenticateUserMiddlewarePipeline,
    isProductIdPresent,
    checkIfProductExists,
    ensurePredictionPropertiesArePresent
]

module.exports = {
    checkIfProductExists,
    ensurePredictionPropertiesArePresent,
    useProductMiddlewarePipeline
};
