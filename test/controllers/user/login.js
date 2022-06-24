require('dotenv').config()

const express = require('express');
const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const chaiHttp = require('chai-http');
const chai = require('chai');
const bcrypt = require('bcrypt');
const expect = chai.expect;
const assert = chai.assert;

chai.use(chaiHttp);

const {mongoDbTestUriKey, jwtSecretKey} = require('../../../suppliers/constants');
const setUpMongooseConnection = require('../../../data/connection');
const loginUser = require('../../../controllers/users/login');

// const server = express();
//
// server.use(express.json());
// server.use(express.urlencoded({extended: false}));
//
// server.post('/api/users/login', loginUser)
//
// const handleError = (err, req, res) => {
//     res.json({message: err.message});
// }
//
// server.use(handleError);


const httpMocks = require('node-mocks-http');
const mongoose = require('mongoose');
const {MongoMemoryServer} = require('mongodb-memory-server');
const log = require('npmlog');
const User = require('../../../data/models/user');
const {
    requireLoginData,
    fetchUserModelByEmail
} = require('../../../controllers/users/login')

// Turn off logging for tests.
log.level = log.levels.silent;

let mongoServer = undefined;

describe('Test user login controller', function () {

    before(async function() {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(
            mongoServer.getUri()
        );
    });

    describe('Test require login data', function () {

        it('Should set email and password on req', function (done) {
            const emailValue = 'some@email';
            const passwordValue = 'password';

            const {req, res} = httpMocks.createMocks({
                method: 'POST',
                body: {
                    email: emailValue,
                    password: passwordValue
                }
            }, {});

            requireLoginData(req, res, function () {
                // Req should have those properties.
                expect(req).to.have.property('email');
                expect(req).to.have.property('password');

                const {email, password} = req;
                // Properties should be strings.
                assert.typeOf(email, 'string');
                assert.typeOf(password, 'string');
                //Properties should have this value.
                assert.equal(email, emailValue);
                assert.equal(password, passwordValue);

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
                const {req, res} = httpMocks.createMocks({
                    method: 'POST',
                    body: reqBody
                }, {});

                requireLoginData(req, res, _ => {});

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
        before(async function() {
            await User.create({
                name: 'name',
                surname: 'surname',
                email: 'some@email',
                password: 'password',
                organization: 'org',
                status: 'verified'
            });
        });



        after(async function() {
            await User.deleteOne({email: 'some@email'});
        });
    })


    after(async function() {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

})


// suite('Test user login controller', function () {
//
//     suiteSetup(function (done) {
//         setUpMongooseConnection(mongoDbTestUriKey, () => {
//
//             const salt = bcrypt.genSaltSync(10);
//
//             User
//                 .create({
//                     name: 'sample',
//                     surname: 'sample',
//                     email: 'email',
//                     password: bcrypt.hashSync('password', salt),
//                     organization: 'sample',
//                     last_login: new Date(2022, 1, 12, 12, 0, 0, 0)
//                 })
//                 .then(() => {
//                     done();
//                 })
//                 .catch(done)
//
//         })
//     })
//
//     test('Correct login request', async function () {
//         const res = await chai
//             .request(server)
//             .post('/api/users/login')
//             .type('json')
//             .send({
//                 email: 'email',
//                 password: 'password'
//             })
//
//         expect(res).to.have.status(httpStatus.OK);
//         expect(res).to.be.json;
//
//         const {body} = res;
//
//         expect(body).to.have.property('_id');
//         expect(body).to.have.property('status');
//         expect(body).to.have.property('permission');
//         expect(body).to.have.property('token');
//
//         assert.strictEqual(body.status, 'unverified');
//         assert.strictEqual(body.permission, 'user');
//
//         try {
//             // Below WebStorm complained about wrong signature, but I used
//             // 'verify' correctly in a synchronous way.
//             // noinspection JSCheckFunctionSignatures
//             const payload = jwt.verify(body.token, process.env[jwtSecretKey]);
//             assert.strictEqual(payload._id, body._id);
//             assert.strictEqual(payload.status, body.status);
//             assert.strictEqual(payload.permission, body.permission);
//         } catch (err) {
//             assert.fail(`unexpected error: ${err.message}`);
//         }
//
//         // Check whether last login field has been updated correctly.
//         const {_id} = body;
//         const user = await User.findById(_id);
//         const dateMilliseconds = new Date(user['last_login']).getTime();
//         const nowMilliseconds = Date.now();
//         // Assuming that both dates may differ by at most 1s.
//         const delta = 1000;
//         assert.approximately(dateMilliseconds, nowMilliseconds, delta);
//     })
//
//     suiteTeardown(async function () {
//         await User.deleteMany({})
//         await mongoose.connection.close();
//     })
//})

