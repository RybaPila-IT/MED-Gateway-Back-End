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
// This module loaded this way in order to ensure mocking of nodemailer.
let sendVerificationEmail = undefined;
let requireVerificationData = undefined;
let createVerification = undefined;
let sendResponse = undefined;

// Turn off logging for tests
log.pause();

let mongoServer = undefined;

describe('Test verification send controller', function () {

    before(async function () {
        // Set up mongo server for mongoose
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
        // Mock the nodemailer package
        await mockery.enable({
            warnOnUnregistered: false,
            warnOnReplace: false
        });
        await mockery.registerMock('nodemailer', nodemailerMock);
        // Load packages this way in order to mock the transporter.
        const {
            requireVerificationData: f1,
            createVerification: f2,
            sendVerificationEmail: f3,
            sendResponse: f4
        } = require('../../../controllers/verification/send');
        // Assign the imports
        requireVerificationData = f1;
        createVerification = f2;
        sendVerificationEmail = f3;
        sendResponse = f4;
    });

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

    describe('Test create verification', function () {

        it('Should create verification and set ver in req', async function () {

            const {req, res} = httpMocks.createMocks();
            let nextCalled = false;
            // Preparing the req
            req.user = {
                _id: '537eed02ed345b2e039652d2'
            };

            await createVerification(req, res, async function () {
                nextCalled = true;

                const verification = await Verification.findOne({user_id: '537eed02ed345b2e039652d2'});

                expect(verification).not.to.be.undefined;
                expect(req).to.have.property('ver');
                expect(req.ver).to.include(verification['_doc']);
            });

            expect(nextCalled).to.be.true;
        });

    });

    describe('Test send verification email', function () {

        // afterEach(function() {
        //     nodemailerMock.mock.reset();
        // });

        it('Should send verification email', async function () {
            const {req, res} = httpMocks.createMocks();
            let nextCalled = false;
            // Preparing the req
            req.user = {
                email: 'someEmail@gmail.com'
            };
            req.ver = {
                _id: '12345'
            };

            await sendVerificationEmail(req, res, function() {
                nextCalled = true;

                const sentMail = nodemailerMock.mock.getSentMail();

                expect(sentMail.length).to.equal(1);
                expect(sentMail[0]).to.have.include({
                    from: 'med-gateway@outlook.com',
                    to: 'someEmail@gmail.com',
                    subject: 'Account verification',
                    html: '<h1>Welcome to MED-Gateway System!</h1>In order to verify the account please visit this <a href="http://localhost/5000/api/verify/12345">link</a>'
                });
            });

            expect(nextCalled).to.be.true;
        });

        it('Should return INTERNAL_SERVER_ERROR with "message" in JSON res', async function () {
            nodemailerMock.mock.setShouldFailOnce();

            const {req, res} = httpMocks.createMocks();
            // Preparing the req
            req.user = {
                email: 'someEmail@gmail.com'
            };
            req.ver = {
                _id: '12345'
            };

            await sendVerificationEmail(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

    });

    describe('Test send response', function () {

        it('Should return OK with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();

            sendResponse(req, res);

            expect(res._getStatusCode()).to.be.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

    });

    after(async function () {
        // Stop mongo server
        await mongoose.disconnect();
        await mongoServer.stop();
        // Turn off mockery
        await mockery.deregisterAll();
        await mockery.disable();
    });

});