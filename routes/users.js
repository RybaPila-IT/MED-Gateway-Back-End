const express = require('express');
const router = express.Router();

const registerUser = require('../controllers/users/register');

router.post('/register', registerUser);

router.post('/login', );

router
    .route('/me')
    .get()
    .put()
    .delete()

module.exports = router;
