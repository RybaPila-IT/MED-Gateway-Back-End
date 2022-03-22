const express = require('express');
const router = express.Router();

router.route('/authenticate')
    .post((req, res) => {
        res.json({message: 'This is the authenticate endpoint'});
    });

module.exports = router;