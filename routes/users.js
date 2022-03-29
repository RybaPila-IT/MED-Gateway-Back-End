const express = require('express');
const router = express.Router();

const registerUser = require('../controllers/users/register');
const loginUser = require('../controllers/users/login');
const getUser = require('../controllers/users/get');


router.post('/register', ...registerUser);
router.post('/login', ...loginUser);

router
    .route('/me')
    .get(...getUser)
    .put()
    .delete()

module.exports = router;
