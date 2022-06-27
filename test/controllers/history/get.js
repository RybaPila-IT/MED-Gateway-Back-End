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
    fetchUserHistory,
    sendResponse
} = require('../../../controllers/history/get');

// Turn off logging for tests
log.pause();

describe('Test get history controller', function () {

    describe('Test require product ID in params', function () {

        it('Should call next', function (done) {
            const {req, res} = httpMocks.createMocks({params: {productId: '123'}});

            requireProductIdInParams(req, res, done);
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


});