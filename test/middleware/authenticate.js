require('dotenv').config();

const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const chai = require('chai');
const expect = chai.expect;
const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const EnvKeys = require('../../env/keys');
const {
    requireBearerAuthorization,
    verifyUserToken,
    verifyUserStatus
} = require('../../middleware/authenticate');

// Turn off logging for testing.
log.pause();

describe('Test authenticate middleware', function () {

    describe('Test require bearer authentication', function () {

        it('Should respond with NOT_FOUND status with "message" in JSON res', function (done) {
            // No Authorization header
            const {req, res} = httpMocks.createMocks();

            requireBearerAuthorization(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.NOT_FOUND);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

        it('Should respond with NOT_FOUND status with "message" in JSON res', function (done) {
            // No Authorization header
            const {req, res} = httpMocks.createMocks({headers: {'Authorization': 'User Password'}});

            requireBearerAuthorization(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.NOT_FOUND);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

        it('Should pass authorization header checking', function (done) {
            const {req, res} = httpMocks.createMocks({headers: {'Authorization': 'Bearer token'}});

            requireBearerAuthorization(req, res, done);
        });

    });

    describe('Test verify user token', function () {

        it('Should return NOT_FOUND with "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks({headers: {'Authorization': 'Bearer token'}});
            verifyUserToken(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.NOT_FOUND);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

        it('Should set decoded token in req.context', function (done) {
            const payload = {_id: '1', status: 'verified'};
            const key = process.env[EnvKeys.jwtSecret];
            const token = jwt.sign(payload, key);

            const {req, res} = httpMocks.createMocks({headers: {'Authorization': `Bearer ${token}`}});
            // Preparing req
            req.context = {}

            verifyUserToken(req, res, function () {
                expect(req.context).to.have.property('token');
                expect(req.context.token).to.include(payload);
                done();
            });
        });

    });

    describe('Test verify user status', function () {

        it('Should respond with UNAUTHORIZED and "message" in JSON res', function (done) {
            const {req, res} = httpMocks.createMocks();
            // Preparing req
            req.context = {
                token: {
                    _id: '123',
                    status: 'unverified'
                }
            };

            verifyUserStatus(req, res);

            expect(res._getStatusCode()).to.equal(httpStatus.UNAUTHORIZED);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

        it('Should pass verification', function (done) {
            const {req, res} = httpMocks.createMocks();
            // Preparing req
            req.context = {
                token: {
                    _id: '123',
                    status: 'verified'
                }
            };

            verifyUserStatus(req, res, done);
        });

    });

});