const {authenticateAndVerifyUserMiddlewarePipeline} = require('../users/authenticate');
const {isProductIdPresent} = require('../products/get');
const {checkIfProductExists} = require('../products/use');


const getHistoryMiddlewarePipeline = [
    ...authenticateAndVerifyUserMiddlewarePipeline,
    isProductIdPresent,
    checkIfProductExists
];

module.exports = {
    getHistoryMiddlewarePipeline
};