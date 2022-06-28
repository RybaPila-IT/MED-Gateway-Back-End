const express = require('express');
const router = express.Router();

const {getHistory} = require('../controllers/history/get');

router.get('/:productID', getHistory);

module.exports = router;