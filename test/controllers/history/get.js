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

    describe('Test fetch history', function () {

        before(async function () {
            await History.create({
                user_id: '537eed02ed345b2e039652d2',
                product_id: '537eed02ed345b2e039652d2'
            });
        });

        it('Should set history in req', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.token = {
                _id: '537eed02ed345b2e039652d2'
            };
            req.productID = '537eed02ed345b2e039652d2';

            await fetchHistory(req, res, function () {
            });

            expect(req).to.have.property('history');
            expect(req.history).to.have.property('user_id').and.to.be.deep.equal(
                new mongoose.Types.ObjectId('537eed02ed345b2e039652d2')
            );
            expect(req.history).to.have.property('product_id').and.to.be.deep.equal(
                new mongoose.Types.ObjectId('537eed02ed345b2e039652d2')
            );
        });

        it('Should create new history and set history in req', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.token = {
                _id: '537eed02ed345b2e039652d3'
            };
            req.productID = '537eed02ed345b2e039652d3';

            await fetchHistory(req, res, function () {
            });

            expect(req).to.have.property('history');
            expect(req.history).to.have.property('user_id').and.to.be.deep.equal(
                new mongoose.Types.ObjectId('537eed02ed345b2e039652d3')
            );
            expect(req.history).to.have.property('product_id').and.to.be.deep.equal(
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
            req.productID = 'hello';

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
                user_id: new mongoose.Types.ObjectId(),
                product_id: new mongoose.Types.ObjectId(),
                entries: [
                    {_doc: '1'},
                    {_doc: '2'},
                    {_doc: '3'},
                ]
            };
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.history = history;

            sendResponse(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('entries');
            expect(res._getJSONData().entries).to.include.members(['1', '2', '3']);
            done();
        });

    })

    after(async function () {
        // Stop mongo server
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});