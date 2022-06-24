const express = require('express')
const router = express.Router();

const {verifyUser} = require('../controllers/verification/verify');
const {sendVerificationMail} = require('../controllers/verification/send');

router.get('/:verifyId', ...verifyUser);
router.post('/send', ...sendVerificationMail);

module.exports = router;