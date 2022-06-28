const express = require('express');
const router = express.Router();

const {getProductsSummary, getProduct} = require('../controllers/products/get');
const {useProduct} = require('../controllers/products/use')
const {createContext} = require('../middleware/context');

router.use(createContext);

router.get('/', getProductsSummary);

router.route('/:productID')
    .get(getProduct)
    .post(useProduct)

module.exports = router;
