// require('dotenv').config();
//
// const express = require('express');
// const httpStatus = require('http-status-codes');
// const chaiHttp = require('chai-http');
// const chai = require('chai');
// const assert = chai.assert;
// const expect = chai.expect;
//
// chai.use(chaiHttp);
//
// const {getSingleProductMiddlewarePipeline} = require('../../../middleware/products/get');
//
// const server = express();
//
// server.use(express.json());
// server.use(express.urlencoded({extended: false}));
//
// server.get('/api/products/:productId',
//     ...getSingleProductMiddlewarePipeline,
//     (req, res) => {
//         res.status(httpStatus.OK).json({
//             message: 'All went successfully',
//             productId: req.params['productId']
//         })
//     }
// )
//
// //noinspection JSUnusedLocalSymbols
// const handleError = (err, req, res, next) => {
//     res.json({message: err.message});
// }
//
// server.use(handleError);
//
// suite('Test get single product middleware pipeline', function () {
//
//     test('Valid request', async function () {
//
//         const expectedMessage = 'All went successfully';
//         const expectedProductId = '1234';
//
//         const res = await chai
//             .request(server)
//             .get('/api/products/1234')
//
//         expect(res).to.have.status(httpStatus.OK);
//         expect(res).to.be.json;
//         assert.strictEqual(res.body.message, expectedMessage);
//         assert.strictEqual(res.body.productId, expectedProductId);
//     })
//
// })