require('dotenv').config()

const mongoose = require("mongoose");
const httpStatus = require('http-status-codes');
const chai = require('chai');
const expect = chai.expect;
const {MongoMemoryServer} = require('mongodb-memory-server');
const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const Product = require('../../../data/models/product');
const {
    requireProductIdInParams,
    fetchProduct,
    fetchProductsSummary,
    sendProductsSummaryResponse,
    sendSingleProductResponse
} = require('../../../controllers/products/get');

// Turn off logging for testing
log.pause();

let mongoServer = undefined;

describe('Test get product controller', function () {

    before(async function () {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
    });

    describe('Test require product id in params', function () {

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();
            // Prepare req
            req.context = {};

            requireProductIdInParams(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks({params: {productID: 'hello'}});
            // Prepare req
            req.context = {};

            requireProductIdInParams(req, res);

            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            done();
        });

        it('Should set productID in req.context', function (done) {
            const {req, res} = httpMocks.createMocks({params: {productID: '551137c2f9e1fac808a5f572'}});
            // Prepare req
            req.context = {};

            requireProductIdInParams(req, res, function () {
                expect(req.context).to.have.property('productID');
                expect(req.context.productID).to.be.equal('551137c2f9e1fac808a5f572');
                done();
            });
        });

    });

    describe('Test fetch product data', function () {

        let productDOC = undefined;

        before(async function () {
            productDOC = await Product.create({
                name: 'test',
                short_description: 'test',
                full_description: 'test',
                usage_description: 'test',
                is_active: true,
                photo_url: 'test'
            });
        });

        it('Should return BAD_REQUEST with "message" in JSON res', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.context = {
                productID: '537eed02ed345b2e039652d2'
            };

            await fetchProduct(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should set product in req.context', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.context = {
                productID: productDOC._id.toString()
            };

            await fetchProduct(req, res, function () {
            });

            expect(req.context).to.have.property('product');
            expect(req.context.product).to.deep.include({
                _id: productDOC._id,
                name: 'test',
                short_description: 'test',
                full_description: 'test',
                usage_description: 'test',
                is_active: true,
                photo_url: 'test'
            });
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.context = {
                productID: 'hello'
            };

            await fetchProduct(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        after(async function () {
            await productDOC.delete();
            productDOC = undefined;
        });

    });

    describe('Test send single product response', function () {

        it('Should send OK with product in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.context = {
                product: {
                    _doc: {
                        _id: new mongoose.Types.ObjectId('0000007b99ccd28759885d0a'),
                        rest: 'rest'
                    },
                    rest2: 'some additional stuff',
                    _id: new mongoose.Types.ObjectId('0000007b99ccd28759885d0a'),
                    name: 'test'
                }
            };

            sendSingleProductResponse(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.deep.include({
                _id: '0000007b99ccd28759885d0a',
                rest: 'rest'
            });
            done();
        })

    });


    describe('Test get all products summary', function () {

        const products = [
            {
                name: 'Product_1',
                short_description: 'Short1',
                full_description: 'Full1',
                usage_description: 'Usage1',
                is_active: true,
                photo_url: 'Url1'
            },
            {
                name: 'Product_2',
                short_description: 'Short2',
                full_description: 'Full2',
                usage_description: 'Usage2',
                is_active: false,
                photo_url: 'Url2'
            }
        ]
        let productDOCS = undefined;

        before(async function () {
            productDOCS = await Product.create(products);
        });

        it('Should set products_docs in req.context', async function () {
            const {req, res} = httpMocks.createMocks();
            // Prepare req
            req.context = {};

            await fetchProductsSummary(req, res, function () {
            });

            expect(req.context).to.have.property('products');
            expect(req.context.products).to.be.an('array').that.has.length(2);

            const products = req.context.products.map(product => product._doc);

            expect(products).to.deep.include.members([
                {
                    _id: productDOCS[0]._id,
                    name: 'Product_1',
                    short_description: 'Short1',
                    is_active: true,
                    photo_url: 'Url1'
                },
                {
                    _id: productDOCS[1]._id,
                    name: 'Product_2',
                    short_description: 'Short2',
                    is_active: false,
                    photo_url: 'Url2'
                }
            ]);
        });

        after(async function () {
            await Product.deleteMany({}).exec();
        });

    });

    describe('Test send products summary response', function () {

        it('Should return OK with products in JSON res', function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.context = {
                products: [
                    {
                        _doc: 'doc1',
                        rest: 'rest1'
                    },
                    {
                        _doc: 'doc2',
                        rest: 'rest2'
                    }
                ]
            };

            sendProductsSummaryResponse(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.be.an('array').and.to.include.members(['doc1', 'doc2']);
        });


    });

    after(async function () {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});