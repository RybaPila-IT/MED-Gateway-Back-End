const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.json({message: 'Welcome to MED-Gateway Backend Service'});
});

module.exports = router;
