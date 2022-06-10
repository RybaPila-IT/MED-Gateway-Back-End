const express = require('express')
const router = express.Router();

const {verifyUser} = require('../controllers/verification/verify');

router.get('/:verifyId', ...verifyUser);

module.exports = router;