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
const getUser = require('../../../controllers/users/get');
const User = require('../../../data/models/user');

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.post('/api/users/me', ...getUser);

//noinspection JSUnusedLocalSymbols
const handleError = (err, req, res, next) => {
    res.json({message: err.message});
}

server.use(handleError);

suite('Test get user controller', function () {

    let _id = 0;

    suiteSetup(function (done) {
        setUpMongooseConnection(mongoDbTestUriKey, () => {

            const salt = bcrypt.genSaltSync(10);

            User
                .create({
                    name: 'John',
                    surname: 'Doe',
                    email: 'john.doe@gmail.com',
                    password: bcrypt.hashSync('password', salt),
                    organization: 'PW'
                })
                .then(user => {
                    _id = user['_id'];
                    done();
                })
                .catch(done)
        })
    })

    test('Get user data', async function() {

        const payload = {
            _id,
            status: 'unverified',
            permission: 'user'
        }
        // Below WebStorm complained about wrong signature, but I used
        // 'verify' correctly in a synchronous way.
        // noinspection JSCheckFunctionSignatures
        const token = jwt.sign(payload, process.env[jwtSecretKey], {expiresIn: '2h'})

        const res = await chai
            .request(server)
            .post('/api/users/me')
            .type('json')
            .auth(token, {type: 'bearer'})
            .send({
                email: 'john.doe@gmail.com',
                password: 'password'
            })

        expect(res).to.have.status(httpStatus.OK);
        expect(res).to.be.json;

        const {body} = res;

        expect(body).to.have.property('_id');
        expect(body).to.have.property('name');
        expect(body).to.have.property('surname');
        expect(body).to.have.property('email');
        expect(body).to.have.property('organization');
        expect(body).to.have.property('status');
        expect(body).to.have.property('permission');
        expect(body).to.have.property('picture');

        expect(body).to.not.have.property('password');
        expect(body).to.not.have.property('registered_at');
        expect(body).to.not.have.property('updated_at');
        expect(body).to.not.have.property('__v');
        expect(body).to.not.have.property('last_login');

        assert.strictEqual(body.name, 'John');
        assert.strictEqual(body.surname, 'Doe');
        assert.strictEqual(body.email, 'john.doe@gmail.com');
        assert.strictEqual(body.organization, 'PW');
        assert.strictEqual(body.status, 'unverified');
        assert.strictEqual(body.permission, 'user');
        assert.strictEqual(body.picture, '');
    })

    suiteTeardown(async function() {
        await User.deleteMany({})
        await mongoose.connection.close();
    })
})

