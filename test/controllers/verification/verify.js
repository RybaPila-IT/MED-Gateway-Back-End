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
const Verification = require('../../../data/models/verification');
const User = require('../../../data/models/user');
const {
    requireVerificationData,
    fetchVerificationById,
    verifyUserAccount,
    deleteVerification,
    sendResponse
} = require('../../../controllers/verification/verify');

// Turn off logging for tests
log.pause();

let mongoServer = undefined;

describe('Test verification verify controller', function () {

    before(async function () {
        // Set up mongo server for mongoose
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
    });

    describe('Test require verification data', function () {

        it('Should call next and set verifyId in req', function (done) {
            const {req, res} = httpMocks.createMocks({params: {verifyId: '123'}});

            requireVerificationData(req, res, function () {

                expect(req).to.have.property('verifyId');
                expect(req.verifyId).to.equal('123');
                done();
            });
        });

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();

            requireVerificationData(req, res);

            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            done();
        });

    });

    describe('Test fetch verification by ID', function () {

        let verifyId = undefined;

        before(async function () {
            const ver = await Verification.create({user_id: '537eed02ed345b2e039652d2'});
            verifyId = ver._id;
        });


        it('Should set ver in req containing verification data', async function () {

            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.verifyId = verifyId;

            await fetchVerificationById(req, res, function () {
            });

            const ver = await Verification.findById(verifyId);

            expect(req).to.have.property('ver');
            expect(req.ver._id.toString()).to.equal(ver['_doc']._id.toString());
        });

        it('Should return BAD_REQUEST with "message" in JSON res', async function () {

            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.verifyId = '537eed02ed345b2e039652d2';

            await fetchVerificationById(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {

            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.verifyId = 'hello';

            await fetchVerificationById(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');

        });

        after(async function () {
            await Verification.deleteMany({});
        });

    });

    describe('Test verify user account', function () {

        let userId = undefined;

        before(async function () {
            const user = await User.create({
                name: 'test',
                surname: 'test',
                email: 'some@email',
                password: 'password',
                organization: 'test',
                status: 'unverified'
            });
            userId = user._id;
        });

        it('Should return BAD_REQUEST with "message" in JSON res', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the request
            req.ver = {
                user_id: '537eed02ed345b2e039652d2'
            };

            await verifyUserAccount(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the request
            req.ver = {
                user_id: 'hello'
            };

            await verifyUserAccount(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should verify user and call next', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the request
            req.ver = {
                user_id: userId
            };

            await verifyUserAccount(req, res, function () {
            });

            const user = await User.findById(userId).exec();

            expect(user.status).to.be.equal('verified');
        });

        after(async function () {
            await User.deleteMany({});
        });

    });

    describe('Test delete verification', function () {

        let verificationId = undefined;

        beforeEach(async function () {
            const ver = await Verification.create({user_id: '537eed02ed345b2e039652d2'});
            verificationId = ver._id;
        });

        it('Should delete verification entry', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.ver = {
                _id: verificationId
            };

            await deleteVerification(req, res, function () {
            });

            const ver = await Verification.findById(verificationId);

            expect(ver).to.be.null;
        });

        it('Should not delete verification entry (1)', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.ver = {
                _id: '537eed02ed345b2e039652d2'
            };

            await deleteVerification(req, res, function () {
            });

            const ver = await Verification.findById(verificationId);

            expect(ver).to.not.be.undefined;
        });

        it('Should not delete verification entry (2)', async function () {
            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.ver = {
                _id: 'hello'
            };

            await deleteVerification(req, res, function () {
            });

            const ver = await Verification.findById(verificationId);

            expect(ver).to.not.be.undefined;
        });

        afterEach(async function () {
            await Verification.deleteMany({});
        });

    });

    describe('Test send response', function () {

        it('Should return OK with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();

            sendResponse(req, res);

            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            done();
        });

    });

    after(async function () {
        // Stop mongo server
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});