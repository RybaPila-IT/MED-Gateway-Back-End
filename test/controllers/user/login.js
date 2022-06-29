require('dotenv').config()

const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const bcrypt = require('bcrypt');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');
const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');
const log = require('npmlog');
const User = require('../../../data/models/user');
const EnvKeys = require('../../../env/keys');
const {
    requireLoginData,
    fetchUserModelByEmail,
    verifyUserPassword,
    createToken,
    sendResponse
} = require('../../../controllers/user/login')

// Turn off logging for tests.
log.pause();

let mongoServer = undefined;

describe('Test user login controller', function () {

    before(async function () {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
    });

    describe('Test require login data', function () {

        it('Should set email and password on req.context', function (done) {
            const emailValue = 'some@email';
            const passwordValue = 'password';

            const {req, res} = httpMocks.createMocks({
                body: {
                    email: emailValue,
                    password: passwordValue
                }
            }, {});
            // Preparing the req
            req.context = {};

            requireLoginData(req, res, function () {
                // Req should have those properties.
                expect(req.context).to.have.property('email');
                expect(req.context).to.have.property('password');
                expect(req.context.email).to.be.string(emailValue);
                expect(req.context.password).to.be.string(passwordValue);
                done();
            });
        });

        it('Should respond with BAD_REQUEST and have "message" field in JSON response', function (done) {
            let testsLeft = 2;
            const body = {
                email: 'some@email',
                password: 'password'
            };
            for (const [key, _] of Object.entries(body)) {
                const reqBody = {...body}
                delete reqBody[key]
                // Actual test starts here.
                const {req, res} = httpMocks.createMocks({body: reqBody}, {});
                // Preparing the req
                req.context = {};

                requireLoginData(req, res);

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

    describe('Test fetch user model by email', function () {

        let user = undefined

        before(async function () {
            user = await User.create({
                name: 'name',
                surname: 'surname',
                email: 'some@email',
                password: 'password',
                organization: 'org',
                status: 'verified'
            });
        });

        it('Should respond with UNAUTHORIZED and have "message" field in JSON res', async function () {
            const {req, res} = httpMocks.createMocks();
            // Set email field in req since fetchUserModelByEmail uses it.
            req.context = {
                email: 'some_other@email'
            };

            await fetchUserModelByEmail(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.UNAUTHORIZED);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

        it('Should set user in req.context', async function () {
            const {req, res} = httpMocks.createMocks();
            // Set email field in req since fetchUserModelByEmail uses it.
            req.context = {
                email: 'some@email'
            };

            await fetchUserModelByEmail(req, res, function () {
            });

            expect(req.context).to.have.property('user');
            expect(req.context.user._doc).to.include({
                name: 'name',
                surname: 'surname',
                email: 'some@email',
                password: 'password',
                organization: 'org',
                status: 'verified'
            });
        });

        after(async function () {
            await User.deleteOne({email: 'some@email'});
        });

    });

    describe('Test verify user password', function () {

        it('Should correctly verify password', async function () {
            const originalPassword = 'password';
            const salt = 10;
            const hashedPassword = await bcrypt.hash(originalPassword, salt);
            const {req, res} = httpMocks.createMocks();
            let nextCalled = false;
            // Preparing the request
            req.context = {
                user: {
                    _id: '123',
                    name: 'name',
                    surname: 'hello',
                    organization: 'test',
                    email: 'sample@email',
                    password: hashedPassword,
                    status: 'verified'
                },
                password: originalPassword
            };

            await verifyUserPassword(req, res, function () {
                nextCalled = true;
            });

            expect(nextCalled).to.be.true;
        });

        it('Should respond with UNAUTHORIZED with "message" field in JSON res', async function () {
            const originalPassword = 'password';
            const invalidPassword = 'password2';
            const salt = 10;
            const hashedPassword = await bcrypt.hash(originalPassword, salt);
            const {req, res} = httpMocks.createMocks();
            // Prepare the request.
            req.context = {
                user: {
                    _id: '123',
                    name: 'name',
                    surname: 'hello',
                    organization: 'test',
                    email: 'sample@email',
                    password: hashedPassword,
                    status: 'verified'
                },
                password: invalidPassword
            };

            await verifyUserPassword(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.UNAUTHORIZED);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        });

    });

    describe('Test create token', function () {

        it('Should create token and place it in req.context', function (done) {
            const {req, res} = httpMocks.createMocks();
            // Preparing the request
            req.context = {
                user: {
                    _id: '123',
                    name: 'name',
                    surname: 'hello',
                    organization: 'test',
                    email: 'sample@email',
                    password: 'password',
                    status: 'verified'
                }
            };

            createToken(req, res, function () {
            });

            expect(req.context).to.have.property('token');
            // Check the token
            const verified = jwt.verify(req.context.token, process.env[EnvKeys.jwtSecret]);

            expect(verified).to.have.property('_id');
            expect(verified).to.have.property('status');
            expect(verified._id).to.equal('123');
            expect(verified.status).to.equal('verified');
            done();
        });
    });

    describe('Test send response', function () {

        it('Should send a valid response', function (done) {
            const {req, res} = httpMocks.createMocks();
            // Preparing the request.
            req.context = {
                user: {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'test',
                    surname: 'test'
                },
                token: 'token_val'
            }

            sendResponse(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.OK);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('token');
            expect(res._getJSONData().token).to.be.equal('token_val');
            done();
        });
    });

    after(async function () {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

});