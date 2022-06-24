const express = require('express')
const router = express.Router();

const {verifyUser} = require('../controllers/verification/verify');
const {sendVerification} = require('../controllers/verification/send');

router.get('/:verifyId', ...verifyUser);
router.post('/send', ...sendVerification);

module.exports = router;