const express = require('express');
const httpStatus = require('http-status-codes');
const router = express.Router();

router.all('/', (req, res) => {
   res.status(httpStatus.NOT_FOUND).json({message: 'Not found'});
});

module.exports = router;