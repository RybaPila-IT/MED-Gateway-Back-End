const express = require('express')
const router = express.Router();

const {verifyUser} = require('../controllers/verification/verify');
const {sendVerificationMail} = require('../controllers/verification/send');
const {createContext} = require('../middleware/context');

router.use(createContext);

router.get('/:verifyID', ...verifyUser);
router.post('/send', ...sendVerificationMail);

module.exports = router;