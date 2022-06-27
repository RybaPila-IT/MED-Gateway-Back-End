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
    requireProductId,
    validProductId,
    getProductData,
    getAllProductsSummary
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

    describe('Test get product data', function () {

        let productId = undefined;

        before(async function () {
            const product = await Product.create({
                name: 'test',
                short_description: 'test',
                full_description: 'test',
                usage_description: 'test',
                is_active: true,
                photo_url: 'test'
            });
            // Set id for tests.
            productId = product._id;
        });

        it('Should return BAD_REQUEST with "message" in JSON res', async function () {
            const {req, res} = httpMocks.createMocks({params: {productId: '537eed02ed345b2e039652d2'}});

            await getProductData(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should return OK with product data in JSON res', async function () {
            const {req, res} = httpMocks.createMocks({params: {productId}});

            await getProductData(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.include({
                _id: productId.toString(),
                name: 'test',
                short_description: 'test',
                full_description: 'test',
                usage_description: 'test',
                is_active: true,
                photo_url: 'test'
            });
        });

        after(async function () {
            await Product.findByIdAndDelete(productId);
            productId = undefined;
        });

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

        before(async function () {
            const p1 = await Product.create(products[0]);
            const p2 = await Product.create(products[1]);

            products[0]._id = p1._id;
            products[1]._id = p2._id;
        });

        it('Should return OK with array of products in JSON res', async function () {
            const {req, res} = httpMocks.createMocks();

            await getAllProductsSummary(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.be.an('array').that.deep.includes.members([
                {
                    _id: products[0]._id.toString(),
                    name: 'Product_1',
                    short_description: 'Short1',
                    is_active: true,
                    photo_url: 'Url1'
                },
                {
                    _id: products[1]._id.toString(),
                    name: 'Product_2',
                    short_description: 'Short2',
                    is_active: false,
                    photo_url: 'Url2'
                }
            ])
        });

        after(async function () {
            await Product.deleteMany({}).exec();
        });

    });

    after(async function () {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});