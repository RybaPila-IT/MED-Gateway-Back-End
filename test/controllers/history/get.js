require('dotenv').config()

const mongoose = require('mongoose');
const httpStatus = require('http-status-codes');
const chai = require('chai');
const expect = chai.expect;
const {
    MongoMemoryServer
} = require('mongodb-memory-server');
const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const History = require('../../../data/models/history');
const {
    requireProductIdInParams,
    fetchHistory,
    sendResponse
} = require('../../../controllers/history/get');

// Turn off logging for tests
log.pause();

let mongoServer = undefined;

describe('Test get history controller', function () {

    before(async function () {
        // Set up mongo server for mongoose
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
    });

    describe('Test require product ID in params', function () {

        it('Should set product_id in req', function (done) {
            const {req, res} = httpMocks.createMocks({params: {productId: '123'}});

            requireProductIdInParams(req, res, function () {
            });

            expect(req).to.have.property('product_id');
            expect(req.product_id).to.be.equal('123');
            done();
        });

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();

            requireProductIdInParams(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

    });

    describe('Test fetch history', function () {

        before(async function () {
            await History.create({
                user_id: '537eed02ed345b2e039652d2',
                product_id: '537eed02ed345b2e039652d2'
            });
        });

        it('Should set history_doc in req', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.token = {
                _id: '537eed02ed345b2e039652d2'
            };
            req.product_id = '537eed02ed345b2e039652d2';

            await fetchHistory(req, res, function () {
            });

            expect(req).to.have.property('history_doc');
            expect(req.history_doc).to.have.property('user_id').and.to.be.deep.equal(
                new mongoose.Types.ObjectId('537eed02ed345b2e039652d2')
            );
            expect(req.history_doc).to.have.property('product_id').and.to.be.deep.equal(
                new mongoose.Types.ObjectId('537eed02ed345b2e039652d2')
            );
        });

        it('Should create new history and set history_doc in req', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.token = {
                _id: '537eed02ed345b2e039652d3'
            };
            req.product_id = '537eed02ed345b2e039652d3';

            await fetchHistory(req, res, function () {
            });

            expect(req).to.have.property('history_doc');
            expect(req.history_doc).to.have.property('user_id').and.to.be.deep.equal(
                new mongoose.Types.ObjectId('537eed02ed345b2e039652d3')
            );
            expect(req.history_doc).to.have.property('product_id').and.to.be.deep.equal(
                new mongoose.Types.ObjectId('537eed02ed345b2e039652d3')
            );

            const histories = await History.find({}).exec();

            expect(histories.length).to.be.equal(2);
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.token = {
                _id: '537eed02ed345b2e039652d3'
            };
            req.product_id = 'hello';

            await fetchHistory(req, res, function () {
            });

            expect(res._getStatusCode()).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        after(async function () {
            await History.deleteMany({});
        });

    });

    describe('Test send response', function () {

        it('Should return OK with entries in JSON res', function (done) {
            const history = {
                entries: ['1', '2', '3']
            };
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.history = history;

            sendResponse(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('entries');
            expect(res._getJSONData().entries).to.include.members(history.entries);
            done();
        });

    })

    after(async function () {
        // Stop mongo server
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});