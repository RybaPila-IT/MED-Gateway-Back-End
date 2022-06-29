const express = require('express');
const router = express.Router();

const {createContext} = require('../middleware/context');
const {registerUser} = require('../controllers/user/register');
const {loginUser} = require('../controllers/user/login');
const {getUser} = require('../controllers/user/get');

router.use(createContext);

router.post('/register', ...registerUser);
router.post('/login', ...loginUser);
router.get('/me', ...getUser);


module.exports = router;
