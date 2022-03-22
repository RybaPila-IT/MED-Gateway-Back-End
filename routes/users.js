const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.json({message: 'This is where message will be changed'});
});

module.exports = router;
