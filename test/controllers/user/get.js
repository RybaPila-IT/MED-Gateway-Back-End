require('dotenv').config()

const mongoose = require("mongoose");
const httpStatus = require('http-status-codes');
const chai = require('chai');
const expect = chai.expect;
const {
    MongoMemoryServer
} = require('mongodb-memory-server');
const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const User = require('../../../data/models/user');
const {
    getUserData,
    sendResponse
} = require('../../../controllers/user/get');

// Stop logging for testing purposes
log.pause();

let mongoServer = undefined;

describe('Test get user controller', function () {

    describe('Test get user data', function () {

        let userId = undefined;

        before(async function () {
            mongoServer = await MongoMemoryServer.create();
            await mongoose.connect(
                mongoServer.getUri()
            );
            // Create test user
            const user = await User
                .create({
                    name: 'test',
                    surname: 'test',
                    email: 'test@email',
                    password: 'password',
                    organization: 'test',
                    status: 'verified'
                });
            // Set _id for testing purposes
            userId = user['_doc']._id.toString();
        });

        it('Should set user in req object', async function () {
            const {req, res} = httpMocks.createMocks();
            // Prepare request
            req.token = {
                _id: userId
            };
            let nextCalled = false;

            await getUserData(req, res, function() {
                nextCalled = true;
                // Actual tests
                expect(req).to.have.property('token');
                expect(req).to.have.property('user');
                expect(req.user).to.include({
                    name: 'test',
                    surname: 'test',
                    email: 'test@email',
                    organization: 'test',
                    status: 'verified'
                });
                expect(req.user).to.not.have.property('password');
            })

            expect(nextCalled).to.be.true;
        });

        it('Should return BAD_REQUEST with "message" field in JSON', async function () {
            const {req, res} = httpMocks.createMocks();
            // Prepare request
            req.token = {
                // Setting random _id
                _id: new mongoose.Types.ObjectId().toString()
            };

            await getUserData(req, res)

            expect(res._getStatusCode()).to.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should return INTERNAL_SERVER_ERROR with "message in JSON', async function() {
            const {req, res} = httpMocks.createMocks();
            // Prepare request
            req.token = {
                // Setting invalid _id
                _id: 'not-a-id'
            };

            await getUserData(req, res)

            expect(res._getStatusCode()).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        })

        after(async function () {
            await mongoose.disconnect();
            await mongoServer.stop();
        });

    });

    describe('Test send response', function () {

        it('Should send OK response', function (done) {

            const {req, res} = httpMocks.createMocks();
            const user = {
                name: 'test',
                surname: 'test',
                email: 'test@email',
                organization: 'test',
                status: 'verified'
            };
            // Setting up the req
            req.user = user;

            sendResponse(req, res)

            expect(res._getStatusCode()).to.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.include(user);
            done();
        });

    });

});