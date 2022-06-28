require('dotenv').config()

const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const chai = require('chai');
const expect = chai.expect;
const {MongoMemoryServer} = require('mongodb-memory-server');
const log = require('npmlog');
const nock = require('nock');
const httpMocks = require('node-mocks-http');
const Endpoints = require('../../../env/endpoints');
const Product = require('../../../data/models/product');
const {
    productIsActive,
    convertImageData,
    ensurePredictionPropertiesArePresent,
    makePrediction
} = require('../../../controllers/products/use');

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

    describe('Test product is active', function () {

        it('Should call next', function (done) {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.product = {
                is_active: true
            };

            productIsActive(req, res, done);
        });

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {

            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.product = {
                is_active: false
            };

            productIsActive(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

    });

    describe('Test ensure prediction properties are present', function () {

        it('Should pass', function (done) {
            const body = {
                patient_name: 'test',
                patient_surname: 'test',
                description: 'tes',
                data: 'data',
                date: 'date'
            };
            const {req, res} = httpMocks.createMocks({body});

            ensurePredictionPropertiesArePresent(req, res, done);
        });

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {
            let testsLeft = 5;
            const body = {
                patient_name: 'test',
                patient_surname: 'test',
                description: 'tes',
                data: 'data',
                date: 'date'
            };
            for (const [key, _] of Object.entries(body)) {
                const reqBody = {...body}
                delete reqBody[key]
                // Actual test starts here.
                const {req, res} = httpMocks.createMocks({body: reqBody}, {});

                ensurePredictionPropertiesArePresent(req, res);

                expect(res._getStatusCode()).to.equal(httpStatus.BAD_REQUEST);
                expect(res._isJSON()).to.be.true;
                expect(res._getJSONData()).to.have.property('message');
                // Call done if no tests left.
                if (!--testsLeft) {
                    done();
                }
            }
        });

    });

    describe('Test convert image data', function () {

        it('Should set req.body.data into converted response', async function() {
            const data = 'sample data'
            // Setting up nock for the request.
            nock(Endpoints.DicomConverter)
                .post('/convert', body => body === data)
                .reply(200, {data: {prediction: 'This is prediction'}});

            const {req, res} = httpMocks.createMocks({body: {data}});

            await convertImageData(req, res, function (){
            });

            expect(req.body.data).to.be.deep.equal({data: {prediction: 'This is prediction'}});
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function() {
            const data = 'sample data'
            // Setting up nock for the request.
            nock(Endpoints.DicomConverter)
                .post('/convert', body => body === data)
                .replyWithError('Some error happened');

            const {req, res} = httpMocks.createMocks({body: {data}});

            await convertImageData(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

    });

    after(async function () {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});