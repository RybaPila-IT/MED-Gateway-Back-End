require('dotenv').config()

const express = require('express');
const mongoose = require("mongoose");
const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const chaiHttp = require('chai-http');
const chai = require('chai');
const chalk = require("chalk");
const bcrypt = require('bcrypt');
const expect = chai.expect;
const assert = chai.assert;

chai.use(chaiHttp);

const {mongoDbTestUriKey, jwtSecretKey} = require('../../../suppliers/constants');
const setUpMongooseConnection = require('../../../data/connection');
const loginUser = require('../../../controllers/users/login');
const User = require('../../../data/models/user');

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.post('/api/users/login', loginUser)

const handleError = (err, req, res, next) => {
    res.json({message: err.message});
}

server.use(handleError);

suite('Test user login controller', function () {

    suiteSetup(function (done) {
        setUpMongooseConnection(mongoDbTestUriKey, () => {

            const salt = bcrypt.genSaltSync(10);

            User
                .create({
                    name: 'sample',
                    surname: 'sample',
                    email: 'email',
                    password: bcrypt.hashSync('password', salt),
                    organization: 'sample'
                })
                .then(user => {
                    console.log(chalk.green('Initial user has been created, id:', user['_id']));
                    done();
                })
                .catch(done)

        })
    })

    test('Signing a token', async function() {
        const res = await chai
            .request(server)
            .post('/api/users/login')
            .type('json')
            .send({
                email: 'email',
                password: 'password'
            })

        expect(res).to.have.status(httpStatus.OK);
        expect(res).to.be.json;

        const {body} = res;

        expect(body).to.have.property('_id');
        expect(body).to.have.property('status');
        expect(body).to.have.property('permission');
        expect(body).to.have.property('token');

        assert.strictEqual(body.status, 'unverified');
        assert.strictEqual(body.permission, 'user');

        try {
            // Below WebStorm complained about wrong signature, but I used
            // 'verify' correctly in a synchronous way.
            // noinspection JSCheckFunctionSignatures
            const payload = jwt.verify(body.token, process.env[jwtSecretKey]);
            assert.strictEqual(payload._id, body._id);
            assert.strictEqual(payload.status, body.status);
            assert.strictEqual(payload.permission, body.permission);
        } catch (err) {
            assert.fail(`unexpected error: ${err.message}`);
        }
    })

    suiteTeardown(async function() {
        await User.deleteMany({})
        await mongoose.connection.close();
    })
})

