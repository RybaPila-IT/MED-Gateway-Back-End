require('dotenv').config()

const mongoose = require("mongoose");
const httpStatus = require('http-status-codes');
const chai = require('chai');
const expect = chai.expect;
const {
    MongoMemoryServer
} = require('mongodb-memory-server');
const mockery = require('mockery');
const nodemailerMock = require('nodemailer-mock');
const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const Verification = require('../../../data/models/verification');
const {
    requireVerificationData,
    createVerification,
    sendVerificationMail,
    sendResponse
} = require('../../../controllers/verification/send');

// Turn off logging for tests
log.pause();

let mongoServer = undefined;

describe('Test verification send controller', function () {

    before(async function() {
        // Set up mongo server for mongoose
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
        // Mock the nodemailer package
        mockery.enable({
            warnOnUnregistered: false,
            warnOnReplace: false
        });
        mockery.registerMock('nodemailer', nodemailerMock);
        // Load the transporter in order to mock its nodemailer dependency
        const _ = require('../../../mail/transporter');
    });

    // afterEach(async function() {
    //     nodemailerMock.mock.reset();
    // });

    describe('Test require verification data', function () {

        it('Should return BAD_REQUEST with "message" in JSON res', function (done) {
           const {req, res} = httpMocks.createMocks();

           requireVerificationData(req, res);

           expect(res._getStatusCode()).to.be.equal(httpStatus.BAD_REQUEST);
           expect(res._isJSON()).to.be.true;
           expect(res._getJSONData()).to.have.property('message');
           done();
        });

        it('Should call next and set email in req', function (done) {
            const {req, res} = httpMocks.createMocks({body: {email: 'some@email'}});

            requireVerificationData(req, res, function () {

                expect(req).to.have.property('email');
                expect(req.email).to.equal('some@email');
                done();
            });
        });

    });


    after(async function() {
        // Stop mongo server
        await mongoose.disconnect();
        await mongoServer.stop();
        // Turn off mockery
        mockery.deregisterAll();
        mockery.disable();
    });



});