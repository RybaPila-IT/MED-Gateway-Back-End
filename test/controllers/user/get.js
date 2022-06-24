require('dotenv').config()

const express = require('express');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status-codes');
const chaiHttp = require('chai-http');
const chai = require('chai');
const bcrypt = require('bcrypt');
const expect = chai.expect;
const assert = chai.assert;

chai.use(chaiHttp);


const {mongoDbTestUriKey, jwtSecretKey} = require('../../../suppliers/constants');
const setUpMongooseConnection = require('../../../data/connection');
const getUser = require('../../../controllers/user/get');

// const server = express();
//
// server.use(express.json());
// server.use(express.urlencoded({extended: false}));
//
// server.post('/api/users/me', ...getUser);
//
// //noinspection JSUnusedLocalSymbols
// const handleError = (err, req, res, next) => {
//     res.json({message: err.message});
// }
//
// server.use(handleError);

const {
    MongoMemoryServer
} = require('mongodb-memory-server');
const log = require('npmlog');
const httpMocks = require('node-mocks-http');
const User = require('../../../data/models/user');
const EnvKeys = require('../../../env/keys');
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
            let nextCalled = false;

            await getUserData(req, res, function() {
                nextCalled = true;
            })

            expect(nextCalled).to.be.false;
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
            let nextCalled = false;

            await getUserData(req, res, function() {
                nextCalled = true;
            })

            expect(nextCalled).to.be.false;
            expect(res._getStatusCode()).to.equal(httpStatus.INTERNAL_SERVER_ERROR);
            expect(res._isJSON()).to.be.true;
            expect(res._getJSONData()).to.have.property('message');
        })

        after(async function () {
            await mongoose.disconnect();
            await mongoServer.stop();
        });

    });


});


// suite('Test get user controller', function () {
//
//     let _id = 0;
//
//     suiteSetup(function (done) {
//         setUpMongooseConnection(mongoDbTestUriKey, () => {
//
//             const salt = bcrypt.genSaltSync(10);
//
//             User
//                 .create({
//                     name: 'John',
//                     surname: 'Doe',
//                     email: 'john.doe@gmail.com',
//                     password: bcrypt.hashSync('password', salt),
//                     organization: 'PW'
//                 })
//                 .then(user => {
//                     _id = user['_id'];
//                     done();
//                 })
//                 .catch(done)
//         })
//     })
//
//     test('Get user data', async function() {
//
//         const payload = {
//             _id,
//             status: 'unverified',
//             permission: 'user'
//         }
//         // Below WebStorm complained about wrong signature, but I used
//         // 'verify' correctly in a synchronous way.
//         // noinspection JSCheckFunctionSignatures
//         const token = jwt.sign(payload, process.env[jwtSecretKey], {expiresIn: '2h'})
//
//         const res = await chai
//             .request(server)
//             .post('/api/users/me')
//             .type('json')
//             .auth(token, {type: 'bearer'})
//             .send({
//                 email: 'john.doe@gmail.com',
//                 password: 'password'
//             })
//
//         expect(res).to.have.status(httpStatus.OK);
//         expect(res).to.be.json;
//
//         const {body} = res;
//
//         expect(body).to.have.property('_id');
//         expect(body).to.have.property('name');
//         expect(body).to.have.property('surname');
//         expect(body).to.have.property('email');
//         expect(body).to.have.property('organization');
//         expect(body).to.have.property('status');
//         expect(body).to.have.property('permission');
//         expect(body).to.have.property('picture');
//
//         expect(body).to.not.have.property('password');
//         expect(body).to.not.have.property('registered_at');
//         expect(body).to.not.have.property('updated_at');
//         expect(body).to.not.have.property('__v');
//         expect(body).to.not.have.property('last_login');
//
//         assert.strictEqual(body.name, 'John');
//         assert.strictEqual(body.surname, 'Doe');
//         assert.strictEqual(body.email, 'john.doe@gmail.com');
//         assert.strictEqual(body.organization, 'PW');
//         assert.strictEqual(body.status, 'unverified');
//         assert.strictEqual(body.permission, 'user');
//         assert.strictEqual(body.picture, '');
//     })
//
//     suiteTeardown(async function() {
//         await User.deleteMany({})
//         await mongoose.connection.close();
//     })
// })

