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

        let user = undefined;

        before(async function () {
            mongoServer = await MongoMemoryServer.create();
            await mongoose.connect(
                mongoServer.getUri()
            );
            // Create test user
            user = await User
                .create({
                    name: 'test',
                    surname: 'test',
                    email: 'test@email',
                    password: 'password',
                    organization: 'test',
                    status: 'verified'
                });
        });

        it('Should set user in req.context', async function () {
            const {req, res} = httpMocks.createMocks();
            // Prepare request
            req.context = {
                token: {
                    _id: user._id.toString()
                }
            };

            await getUserData(req, res, function () {
            });

            expect(req.context).to.have.property('token');
            expect(req.context).to.have.property('user');
            expect(req.context.user._doc).to.deep.include({
                _id: user._id,
                name: 'test',
                surname: 'test',
                email: 'test@email',
                organization: 'test',
                status: 'verified'
            });
            expect(req.context.user._doc).to.not.have.property('password');
        });

        it('Should return BAD_REQUEST with "message" field in JSON', async function () {
            const {req, res} = httpMocks.createMocks();
            // Prepare request
            req.context = {
                token: {
                    // Setting random _id
                    _id: new mongoose.Types.ObjectId().toString()
                }
            };

            await getUserData(req, res)

            expect(res._getStatusCode()).to.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should return INTERNAL_SERVER_ERROR with "message in JSON', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing request
            req.context = {
                token: {
                    // Setting invalid _id
                    _id: 'not-a-id'
                }
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
            // Setting up the req
            req.context = {
                user: {
                    _doc: {
                        _id: new mongoose.Types.ObjectId(),
                        name: 'test',
                        surname: 'test',
                        email: 'test@email',
                        organization: 'test',
                        status: 'verified'
                    },
                    _id: new mongoose.Types.ObjectId(),
                    name: 'test',
                    surname: 'test',
                    email: 'test@email',
                    organization: 'test',
                    status: 'verified',
                    other: 'other stuff'
                }
            };

            sendResponse(req, res)

            expect(res._getStatusCode()).to.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.include({
                name: 'test',
                surname: 'test',
                email: 'test@email',
                organization: 'test',
                status: 'verified'
            });
            done();
        });

    });

});