const express = require('express');
const router = express.Router();

const {registerUser} = require('../controllers/user/register');
const {loginUser} = require('../controllers/user/login');
const {getUser} = require('../controllers/user/get');


router.post('/register', ...registerUser);
router.post('/login', ...loginUser);
router.get('/me', ...getUser);


module.exports = router;
