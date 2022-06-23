const express = require('express')
const router = express.Router();

const {verifyUser} = require('../controllers/verification/verify');
const {resendVerification} = require('../controllers/verification/send');

router.get('/:verifyId', ...verifyUser);
router.post('/resend', ...resendVerification);

module.exports = router;