require('dotenv').config()

const httpStatus = require('http-status-codes');
const chai = require('chai');
const expect = chai.expect;
const mongoose = require("mongoose");
const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const {MongoMemoryServer} = require('mongodb-memory-server');
const User = require('../../../data/models/user');
const mockery = require('mockery');
const nodemailerMock = require('nodemailer-mock');

let requireRegisterData = undefined
let genSalt = undefined
let hashPassword = undefined
let createUser = undefined
let sendResponse = undefined


// Stop logging for tests.
log.pause()

let mongoServer = undefined;

describe('Test user register controller', function () {

    before(async function () {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
        // For unique index instantiating
        await User.ensureIndexes();
        // Mock the nodemailer package
        await mockery.enable({
            warnOnUnregistered: false,
            warnOnReplace: false
        });
        await mockery.registerMock('nodemailer', nodemailerMock);
        // Load packages this way in order to mock the transporter.
        const {
            requireRegisterData: f1,
            genSalt: f2,
            hashPassword: f3,
            createUser: f4,
            sendResponse: f5
        } = require('../../../controllers/user/register');
        // Assign loaded functions.
        requireRegisterData = f1;
        genSalt = f2;
        hashPassword = f3;
        createUser = f4;
        sendResponse = f5;
    });

    describe('Test require register data', function () {

        it('Should respond with BAD_REQUEST with "message" in JSON res', function (done) {
            let testsLeft = 5;
            const body = {
                name: 'test',
                surname: 'test',
                email: 'some@email',
                password: 'password',
                organization: 'test'
            };
            for (const [key, _] of Object.entries(body)) {
                const reqBody = {...body}
                delete reqBody[key]
                // Actual test starts here.
                const {req, res} = httpMocks.createMocks({body: reqBody}, {});

                requireRegisterData(req, res);

                expect(res._getStatusCode()).to.equal(httpStatus.BAD_REQUEST);
                expect(res._isJSON()).to.be.true;
                expect(res._getJSONData()).to.have.property('message');
                // Call done if no tests left.
                if (!--testsLeft) {
                    done();
                }
            }
        });

        it('Should call next and pass checks', function (done) {
            const body = {
                name: 'test',
                surname: 'test',
                email: 'some@email',
                password: 'password',
                organization: 'test'
            };
            const {req, res} = httpMocks.createMocks({body}, {});

            requireRegisterData(req, res, done);
        });
    });

    describe('Test gen salt', function () {

        it('Should generate salt in req', async function () {
            const {req, res} = httpMocks.createMocks();
            let nextCalled = false;

            await genSalt(req, res, function () {
                nextCalled = true;
                expect(req).to.have.property('salt');
            });

            expect(nextCalled).to.be.true;
        });

    });

    describe('Test hash password', function () {

        it('Should hash the password', async function () {
            const originalPassword = 'password';
            const {req, res} = httpMocks.createMocks({body: {password: originalPassword}});
            let nextCalled = false;
            // Preparing the request
            req.salt = 10;

            await hashPassword(req, res, function () {
                nextCalled = true;
                expect(req.body.password).to.not.equal(originalPassword);
            });

            expect(nextCalled).to.be.true;
        });

    });

    describe('Test create user', function () {

        before(async function () {
            await User.create({
                name: 'name',
                surname: 'surname',
                email: 'some@email',
                password: 'password',
                organization: 'org',
                status: 'verified'
            });
        });

        it('Should create user', async function () {
            const user = {
                name: 'name',
                surname: 'surname',
                email: 'some2@email',
                password: 'password',
                organization: 'org'
            }
            const {req, res} = httpMocks.createMocks({body: user});
            let nextCalled = false;

            await createUser(req, res, function () {
                nextCalled = true;
            });

            const addedUser = await User.findOne({email: 'some2@email'});

            expect(nextCalled).to.be.true;
            expect(addedUser).not.to.be.undefined;
            expect(addedUser['_doc']).to.include(user);
            expect(addedUser['_doc'].status).to.be.equal('unverified');

            await addedUser.remove();
        });

        it('Should return CONFLICT with "message" in JSON res', async function () {
            const user = {
                name: 'name',
                surname: 'surname',
                email: 'some@email',
                password: 'password',
                organization: 'org'
            }
            const {req, res} = httpMocks.createMocks({body: user});
            let nextCalled = false;

            await createUser(req, res, function () {
                nextCalled = true;
            });

            expect(nextCalled).to.be.false;
            expect(res._getStatusCode()).to.be.equal(httpStatus.CONFLICT);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        after(async function () {
            await User.deleteOne({email: 'some@email'});
        });

    });

    describe('Test send response', function () {

        it('Should return CREATED response with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();

            sendResponse(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.CREATED);
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