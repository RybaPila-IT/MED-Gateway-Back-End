const mongoose = require('mongoose');
const historySchema = require('../schemas/history');

const History = mongoose.model('History', historySchema);

module.exports = History;