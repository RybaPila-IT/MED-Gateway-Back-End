const authenticateUserMiddlewarePipeline = require('../users/authenticate');
const {isProductIdPresent} = require('../products/get');
const {checkIfProductExists} = require('../products/use');


const getHistoryMiddlewarePipeline = [
    ...authenticateUserMiddlewarePipeline,
    isProductIdPresent,
    checkIfProductExists
];

module.exports = {
    getHistoryMiddlewarePipeline
};