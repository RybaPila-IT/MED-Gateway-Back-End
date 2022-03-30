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
const registerUser = require('../../../controllers/users/register');
const User = require('../../../data/models/user');
const mongoose = require("mongoose");

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.post('/api/users/register', ...registerUser)

//noinspection JSUnusedLocalSymbols
const handleError = (err, req, res, next) => {
    res.json({message: err.message});
}

server.use(handleError);


suite('Test register user functionality', function () {

    suiteSetup(function (done) {
        setUpMongooseConnection(mongoDbTestUriKey, done);
    })

    test('Valid registration request', async () => {

        const requestData = {
            name: 'name',
            surname: 'surname',
            email: 'email',
            password: 'password',
            organization: 'organization'
        }

        const res = await chai
            .request(server)
            .post('/api/users/register')
            .type('json')
            .send(requestData)

        expect(res).to.have.status(httpStatus.CREATED);
        expect(res).to.be.json;
        expect(res.body).to.have.property('message');
        expect(res.body).to.have.property('_id');

        const {_id} = res.body;
        const user = await User.findById(_id);

        assert.isDefined(user);
        assert.strictEqual(user['name'], requestData['name']);
        assert.strictEqual(user['surname'], requestData['surname']);
        assert.strictEqual(user['organization'], requestData['organization']);
        assert.strictEqual(user['email'], requestData['email']);
        assert.isTrue(bcrypt.compareSync(requestData['password'], user['password']));

        // // Clear the database after test
        await User.deleteOne({_id});
    });

    test('Duplicate user email in database', async () => {

        // Given
        const requestData = {
            name: 'name',
            surname: 'surname',
            email: 'email',
            password: 'password',
            organization: 'organization'
        }

        const res = await chai
            .request(server)
            .post('/api/users/register')
            .type('json')
            .send(requestData)

        expect(res).to.have.status(httpStatus.CREATED);

        // Do
        const errRes = await chai
            .request(server)
            .post('/api/users/register')
            .type('json')
            .send(requestData)

        // Expect
        expect(errRes).to.have.status(httpStatus.CONFLICT);
        expect(res).to.be.json;
        expect(errRes.body).to.have.property('message');

        // // Clear the database after test
        const {_id} = res.body;
        await User.deleteOne({_id});
    })

    suiteTeardown(async function() {
        await User.deleteMany({})
        await mongoose.connection.close();
    })
})