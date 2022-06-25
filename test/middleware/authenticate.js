require('dotenv').config();

const express = require('express');
const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

chai.use(chaiHttp);

// const {jwtSecretKey} = require('../../../suppliers/constants')
// const {authenticateUserMiddlewarePipeline} = require('../../../middleware/users/authenticate');

// const server = express();
//
// server.use(express.json());
// server.use(express.urlencoded({extended: false}));
//
// server.post('/api/users/me',
//     ...authenticateUserMiddlewarePipeline,
//     (req, res) => {
//         res.status(httpStatus.OK).json({
//             message: 'Successfully authenticated user',
//             decoded_token: req['token']
//         })
//     }
// )
//
// const handleError = (err, req, res, next) => {
//     res.json({message: err.message});
// }
//
// server.use(handleError);


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
            let nextCalled = false;
            requireBearerAuthorization(req, res, function () {
                nextCalled = true;
            });

            expect(nextCalled).to.be.false;
            expect(res._getStatusCode()).to.equal(httpStatus.NOT_FOUND);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            done();
        });

        it('Should respond with NOT_FOUND status with "message" in JSON res', function (done) {
            // No Authorization header
            const {req, res} = httpMocks.createMocks({headers: {'Authorization': 'User Password'}});
            let nextCalled = false;
            requireBearerAuthorization(req, res, function () {
                nextCalled = true
            });

            expect(res._getStatusCode()).to.equal(httpStatus.NOT_FOUND);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
            expect(nextCalled).to.be.false;
            done();
        });

        it('Should pass authorization header checking', function (done) {
            const {req, res} = httpMocks.createMocks({headers: {'Authorization': 'Bearer token'}});
            requireBearerAuthorization(req, res, function () {
                expect(res._getStatusCode()).to.equal(httpStatus.OK);
                done();
            });
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

        it('Should set decoded token in req', function (done) {
            const payload = {_id: '1', status: 'verified'};
            const key = process.env[EnvKeys.jwtSecret];
            const token = jwt.sign(payload, key);

            const {req, res} = httpMocks.createMocks({headers: {'Authorization': `Bearer ${token}`}});

            verifyUserToken(req, res, function () {
                expect(req).to.have.property('token');
                expect(req.token).to.include(payload);
                done();
            });
        });

    });


});


// suite('Test authenticate middleware pipeline', function () {
//
//     test('Valid request with authentication', async function () {
//         const payload = {
//             _id: '651088hfl1233s233',
//             status: 'unverified',
//             permission: 'user'
//         }
//         // Below WebStorm complained about wrong signature, but I used
//         // 'verify' correctly in a synchronous way.
//         // noinspection JSCheckFunctionSignatures
//         const token = jwt.sign(payload, process.env[jwtSecretKey], {expiresIn: '2h'})
//         const res = await chai
//             .request(server)
//             .post('/api/users/me')
//             .type('json')
//             .auth(token, {type: 'bearer'})
//             .send({
//                 data: 'This is not important data'
//             })
//
//         expect(res).to.have.status(httpStatus.OK);
//         expect(res).to.be.json;
//
//         const {body} = res;
//
//         expect(body).to.have.property('message');
//         expect(body).to.have.property('decoded_token');
//
//         assert.strictEqual(body.message, 'Successfully authenticated user');
//         assert.strictEqual(body.decoded_token._id, payload._id);
//         assert.strictEqual(body.decoded_token.status, payload.status);
//         assert.strictEqual(body.decoded_token.permission, payload.permission);
//     });
//
//     test('Web token is corrupted (invalid signature)', async function() {
//         const payload = {
//             _id: '651088hfl1233s233',
//             status: 'unverified',
//             permission: 'user'
//         }
//         // Below WebStorm complained about wrong signature, but I used
//         // 'verify' correctly in a synchronous way.
//         // noinspection JSCheckFunctionSignatures
//         const token = jwt.sign(payload, jwtSecretKey, {expiresIn: '2h'})
//         const res = await chai
//             .request(server)
//             .post('/api/users/me')
//             .type('json')
//             .auth(token, {type: 'bearer'})
//             .send({
//                 data: 'This is not important data'
//             })
//
//         expect(res).to.have.status(httpStatus.NOT_FOUND);
//         expect(res).to.be.json;
//         expect(res.body).to.have.property('message');
//
//         assert.strictEqual(res.body.message, 'Page not found');
//     })
//
//     test('Missing authorization header', async function() {
//         const res = await chai
//             .request(server)
//             .post('/api/users/me')
//             .type('json')
//             .send({
//                 data: 'This is not important data'
//             })
//
//         expect(res).to.have.status(httpStatus.NOT_FOUND);
//         expect(res).to.be.json;
//         expect(res.body).to.have.property('message');
//
//         assert.strictEqual(res.body.message, 'Page not found');
//     })
//
//     test('Wrong authorization mode (with user/password)', async function() {
//         const payload = {
//             _id: '651088hfl1233s233',
//             status: 'unverified',
//             permission: 'user'
//         }
//         // Below WebStorm complained about wrong signature, but I used
//         // 'verify' correctly in a synchronous way.
//         // noinspection JSCheckFunctionSignatures
//         const token = jwt.sign(payload, jwtSecretKey, {expiresIn: '2h'})
//         const res = await chai
//             .request(server)
//             .post('/api/users/me')
//             .type('json')
//             .auth('user', token)
//             .send({
//                 data: 'This is not important data'
//             })
//
//         expect(res).to.have.status(httpStatus.NOT_FOUND);
//         expect(res).to.be.json;
//         expect(res.body).to.have.property('message');
//
//         assert.strictEqual(res.body.message, 'Page not found');
//     })
// })



