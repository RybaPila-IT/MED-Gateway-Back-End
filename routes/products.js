const express = require('express');
const router = express.Router();

const {
    getProductsSummary,
    getProduct
} = require('../controllers/products/get');

router.get('/', getProductsSummary);
router.get('/:productId', getProduct);

module.exports = router;
