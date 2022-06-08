const express = require('express');
const router = express.Router();

const {
    getProductsSummary,
    getProduct
} = require('../controllers/products/get');
const {
    useProduct
} = require('../controllers/products/use')

router.get('/', getProductsSummary);

router.route('/:productId')
    .get(getProduct)
    .post(useProduct)

module.exports = router;
