const express = require('express');
const router = express.Router();

const {getHistory} = require('../controllers/history/get');
const {createContext} = require('../middleware/context');

router.use(createContext);
router.get('/:productID', getHistory);

module.exports = router;