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
const History = require('../../../data/models/history');
const {
    productIsActive,
    convertImageData,
    ensurePredictionPropertiesArePresent,
    makePrediction,
    storePredictionResultInDatabase,
    sendResponse
} = require('../../../controllers/products/use');

// Turn off logging for testing
log.pause();

let mongoServer = undefined;

describe('Test use product controller', function () {

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
            req.product_doc = {
                is_active: true
            };

            productIsActive(req, res, done);
        });

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {

            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.product_doc = {
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

        it('Should set req.body.data into converted response', async function () {
            const data = 'sample data'
            // Setting up nock for the request.
            nock(Endpoints.DicomConverter)
                .post('/convert', body => body === data)
                .reply(200, {data: {prediction: 'This is prediction'}});

            const {req, res} = httpMocks.createMocks({body: {data}});

            await convertImageData(req, res, function () {
            });

            expect(req.body.data).to.be.deep.equal({data: {prediction: 'This is prediction'}});
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {
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

    describe('Test make prediction', function () {

        it('Should set req.body.data with prediction response', async function () {
            const productID = '625576dda784a265d36ff314';
            const data = 'This is some data';
            const {req, res} = httpMocks.createMocks({body: {data}});
            // Setting up the req
            req.productID = productID;
            // Setting up nock for the request.
            nock(Endpoints.Products[productID])
                .post('/predict', body => body === data)
                .reply(200, {prediction: {result1: '1', result2: '2'}});

            await makePrediction(req, res, function () {
            });

            expect(req.body.data).to.deep.equal({prediction: {result1: '1', result2: '2'}});
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {
            const productID = '625576dda784a265d36ff314';
            const data = 'This is some data';
            const {req, res} = httpMocks.createMocks({body: {data}});
            // Setting up the req
            req.product_id = productID;
            // Setting up nock for the request.
            nock(Endpoints.Products[productID])
                .post('/predict', body => body === data)
                .replyWithError('Some error occurred');

            await makePrediction(req, res, function () {
            });

            expect(res._getStatusCode()).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

    });

    describe('Test store prediction photo result in database', function () {

        let historyDOC = undefined;

        before(async function () {
            historyDOC = await History.create({
                user_id: '625576dda784a265d36ff311',
                product_id: '625576dda784a265d36ff311'
            });
        });

        it('Should update history document by adding history entry', async function () {
            const body = {
                patient_name: 'test',
                patient_surname: 'test',
                description: 'tes',
                has_photo: true,
                photo_url: 'url',
                date: new Date(),
                data: {
                    pixels: 'pixels',
                    prediction: {
                        result1: '1',
                        result2: '2'
                    }
                }
            };
            const {req, res} = httpMocks.createMocks({body});
            // Preparing the req
            req.history = historyDOC;

            await storePredictionResultInDatabase(req, res, function () {
            });

            const doc = await History.findById(historyDOC._id).exec();

            expect(doc.entries).to.be.an('array').and.to.have.length(1);
            expect(doc.entries[0]).to.deep.include({
                patient_name: 'test',
                patient_surname: 'test',
                description: 'tes',
                has_photo: true,
                photo_url: 'url',
                date: body.date,
                prediction: {
                    result1: '1',
                    result2: '2'
                }
            });
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {
            const body = {
                patient_name: 'test',
                patient_surname: 'test',
                description: 'tes',
                has_photo: true,
                photo_url: 'url',
                date: 'hello',
                data: {
                    pixels: 'pixels',
                    prediction: {
                        result1: '1',
                        result2: '2'
                    }
                }
            };
            const {req, res} = httpMocks.createMocks({body});
            // Preparing the req
            req.history_doc = historyDOC;

            await storePredictionResultInDatabase(req, res, function () {
            });

            expect(res._getStatusCode()).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        after(async function () {
            await History.deleteMany({});
            historyDOC = undefined;
        });

    });

    describe('Test send response', function () {

        it('Should send OK with "message, photo_url, prediction" in JSON res', function (done) {
            const body = {
                photo_url: 'url',
                data: {
                    pixels: 'pixels',
                    prediction: {
                        result1: '1',
                        result2: '2'
                    }
                }
            };
            const {req, res} = httpMocks.createMocks({body});
            // Preparing the req
            req.token = {
                _id: new mongoose.Types.ObjectId()
            };

            sendResponse(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.deep.include({
                prediction: {
                    result1: '1',
                    result2: '2'
                }
            }).and.to.have.property('message');
            done();
        })

    })

    after(async function () {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});