require('dotenv').config()

const express = require('express');
const httpStatus = require('http-status-codes');
const chaiHttp = require('chai-http');
const chai = require('chai');
const bcrypt = require('bcrypt');
const assert = chai.assert;
const expect = chai.expect;

chai.use(chaiHttp);

const {mongoDbTestUriKey} = require('../../../suppliers/constants');
const setUpMongooseConnection = require('../../../data/connection');
const registerUser = require('../../../controllers/user/register');
const User = require('../../../data/models/user');
const mongoose = require("mongoose");

// const server = express();
//
// server.use(express.json());
// server.use(express.urlencoded({extended: false}));
//
// server.post('/api/user/register', ...registerUser)

//noinspection JSUnusedLocalSymbols
// const handleError = (err, req, res, next) => {
//     res.json({message: err.message});
// }
//
// server.use(handleError);

const httpMocks = require('node-mocks-http');
const {
    requireRegisterData,
    genSalt,
    hashPassword,
    createUser,
    sendResponse
} = require('../../../controllers/user/register')


describe('Test user register controller', function () {

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

        it('Should generate salt in req', async function() {
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

    })



});



// suite('Test register user controller', function () {
//
//     suiteSetup(function (done) {
//         setUpMongooseConnection(mongoDbTestUriKey, done);
//     })
//
//     test('Valid registration request', async () => {
//
//         const requestData = {
//             name: 'name',
//             surname: 'surname',
//             email: 'email',
//             password: 'password',
//             organization: 'organization'
//         }
//
//         const res = await chai
//             .request(server)
//             .post('/api/user/register')
//             .type('json')
//             .send(requestData)
//
//         expect(res).to.have.status(httpStatus.CREATED);
//         expect(res).to.be.json;
//         expect(res.body).to.have.property('message');
//         expect(res.body).to.have.property('_id');
//
//         const {_id} = res.body;
//         const user = await User.findById(_id);
//
//         assert.isDefined(user);
//         assert.strictEqual(user['name'], requestData['name']);
//         assert.strictEqual(user['surname'], requestData['surname']);
//         assert.strictEqual(user['organization'], requestData['organization']);
//         assert.strictEqual(user['email'], requestData['email']);
//         assert.isTrue(bcrypt.compareSync(requestData['password'], user['password']));
//
//         // // Clear the database after test
//         await User.deleteOne({_id});
//     });
//
//     test('Duplicate user email in database', async () => {
//
//         // Given
//         const requestData = {
//             name: 'name',
//             surname: 'surname',
//             email: 'email',
//             password: 'password',
//             organization: 'organization'
//         }
//
//         const res = await chai
//             .request(server)
//             .post('/api/user/register')
//             .type('json')
//             .send(requestData)
//
//         expect(res).to.have.status(httpStatus.CREATED);
//
//         // Do
//         const errRes = await chai
//             .request(server)
//             .post('/api/user/register')
//             .type('json')
//             .send(requestData)
//
//         // Expect
//         expect(errRes).to.have.status(httpStatus.CONFLICT);
//         expect(res).to.be.json;
//         expect(errRes.body).to.have.property('message');
//
//         // // Clear the database after test
//         const {_id} = res.body;
//         await User.deleteOne({_id});
//     })
//
//     suiteTeardown(async function() {
//         await User.deleteMany({})
//         await mongoose.connection.close();
//     })
//})