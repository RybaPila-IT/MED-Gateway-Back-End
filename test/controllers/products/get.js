require('dotenv').config()

const express = require('express');
const mongoose = require("mongoose");
const httpStatus = require('http-status-codes');
const chaiHttp = require('chai-http');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

chai.use(chaiHttp);

// const {mongoDbTestUriKey} = require('../../../suppliers/constants');
// const setUpMongooseConnection = require('../../../data/connection');
// const {
//     getProduct,
//     getProductsSummary
// } = require('../../../controllers/products/get');
// const Product = require('../../../data/models/product');
//
// const server = express();
//
// server.use(express.json());
// server.use(express.urlencoded({extended: false}));
//
// server.get('/api/products', getProductsSummary);
// server.get('/api/products/:productId', getProduct);
//
// //noinspection JSUnusedLocalSymbols
// const handleError = (err, req, res, next) => {
//     res.status(httpStatus.INTERNAL_SERVER_ERROR);
//     res.json({message: err.message});
// }
//
// server.use(handleError);

const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const {
    requireProductId,
    validProductId,
    getProductData,
    getAllProductsSummary
} = require('../../../controllers/products/get')

// Turn off logging for testing
log.pause();

describe('Test get product controller', function () {

    describe('Test require product id', function () {

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();

            requireProductId(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

        it('Should call next', function (done) {
           const {req, res} = httpMocks.createMocks({params: {productId: '123'}});

           requireProductId(req, res, done);
        });

    });

    describe('Test valid product id', function () {

        it('Should call next', function (done) {
            const {req, res} = httpMocks.createMocks({params: {productId: '537eed02ed345b2e039652d2'}});

            validProductId(req, res, done);
        });

        it('Should return BAD_REQUEST with "message" field in JSON res', function (done) {
            const productIds = ['123', 'microsoft123'];
            let tests = 2;
            for (const productId of productIds) {
                const {req, res} = httpMocks.createMocks({params: {productId}});

                validProductId(req, res);

                expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
                expect(res._isJSON()).to.be.true;
                expect(res._getJSONData()).to.have.property('message');
                if (!--tests) {
                    done();
                }
            }
        });

    });


});


// suite('Test get single product controller', function () {
//
//     let _id = 0;
//
//     suiteSetup(function (done) {
//         setUpMongooseConnection(mongoDbTestUriKey, () => {
//             Product
//                 .create({
//                     name: 'Fetal-Net',
//                     short_description: 'Measure fetus body parts with ease',
//                     full_description: 'This is full description',
//                     picture: 'URL of the picture',
//                     usage_description: 'This is usage description'
//                 })
//                 .then(product => {
//                     _id = product['_id'];
//                     done();
//                 })
//                 .catch(done)
//         })
//     })
//
//     test('Get product', async function () {
//
//         const res = await chai
//             .request(server)
//             .get(`/api/products/${_id}`)
//
//         expect(res).to.have.status(httpStatus.OK);
//         expect(res).to.be.json;
//
//         const {body} = res;
//
//         expect(body).to.have.property('_id');
//         expect(body).to.have.property('picture');
//         expect(body).to.have.property('short_description');
//         expect(body).to.have.property('full_description');
//         expect(body).to.have.property('usage_description');
//
//         expect(body).to.not.have.property('created_at');
//         expect(body).to.not.have.property('updated_at');
//         expect(body).to.not.have.property('__v');
//
//         assert.strictEqual(body.name, 'Fetal-Net');
//         assert.strictEqual(body.short_description, 'Measure fetus body parts with ease');
//         assert.strictEqual(body.full_description, 'This is full description');
//         assert.strictEqual(body.picture, 'URL of the picture');
//         assert.strictEqual(body.usage_description, 'This is usage description');
//     })
//
//     test('Invalid get product request (wrong id)', async function () {
//
//         const expectedErrorMessage = 'error: unable to fetch data for product with id 123';
//
//         const res = await chai
//             .request(server)
//             .get('/api/products/123')
//
//         expect(res).to.have.status(httpStatus.INTERNAL_SERVER_ERROR);
//         expect(res).to.be.json;
//
//         const {body} = res;
//
//         expect(body).to.have.property('message');
//
//         assert.strictEqual(body.message, expectedErrorMessage);
//     })
//
//     suiteTeardown(async function () {
//         await Product.deleteMany({})
//         await mongoose.connection.close();
//     })
// })
//
//
// suite('Test get products summary controller', function () {
//
//     let expectedResponseSummary = [];
//
//     suiteSetup(function (done) {
//         setUpMongooseConnection(mongoDbTestUriKey, () => {
//             Product
//                 .create([
//                     {
//                         name: 'Product-1',
//                         short_description: 'Product-1 short description',
//                         full_description: 'Product-1 full description',
//                         picture: 'URL of the picture',
//                         usage_description: 'Product-1 usage description'
//                     },
//                     {
//                         name: 'Product-2',
//                         short_description: 'Product-2 short description',
//                         full_description: 'Product-2 full description',
//                         picture: 'URL of the picture',
//                         usage_description: 'Product-2 usage description'
//                     },
//                     {
//                         name: 'Product-3',
//                         short_description: 'Product-3 short description',
//                         full_description: 'Product-3 full description',
//                         picture: 'URL of the picture',
//                         usage_description: 'Product-3 usage description'
//                     }
//                 ])
//                 .then(products => {
//                     expectedResponseSummary = products.map(product => ({
//                         name: product['name'],
//                         picture: product['picture'],
//                         short_description: product['short_description'],
//                         _id: product['_id'].toString()
//                     }))
//                     done();
//                 })
//                 .catch(done)
//         })
//     })
//
//     test('Get products summary', async function () {
//
//         const res = await chai
//             .request(server)
//             .get('/api/products')
//
//         expect(res).to.have.status(httpStatus.OK);
//         expect(res).to.be.json;
//
//         const {body} = res;
//         expect(body).to.have.property('length');
//         expect(body.length).to.eql(3);
//         expect(body).to.have.deep.members(expectedResponseSummary);
//     })
//
//     suiteTeardown(async function () {
//         await Product.deleteMany({})
//         await mongoose.connection.close();
//     })
// })
//
