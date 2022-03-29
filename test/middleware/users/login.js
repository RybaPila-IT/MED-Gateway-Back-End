require('dotenv').config();

const express = require('express');
const httpStatus = require('http-status-codes');
const chaiHttp = require('chai-http');
const bcrypt = require('bcrypt');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

chai.use(chaiHttp);

const {mongoDbTestUriKey} = require('../../../suppliers/constants');
const setUpMongooseConnection = require('../../../data/connection');
const loginUserMiddlewarePipeline = require('../../../middleware/users/login');
const User = require('../../../data/models/user');
const mongoose = require("mongoose");
const chalk = require("chalk");

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.post('/api/users/login',
    ...loginUserMiddlewarePipeline,
    (req, res) => {
        res.status(httpStatus.OK).json({
            message: 'All went successfully'
        })
    }
)

const handleError = (err, req, res, next) => {
    res.json({message: err.message});
}

server.use(handleError);


suite('Test login middleware pipeline', function () {

    suiteSetup(function (done) {
        setUpMongooseConnection(mongoDbTestUriKey, () => {

            const salt = bcrypt.genSaltSync(10);

            User
                .create({
                    name: 'name',
                    surname: 'surname',
                    email: 'email',
                    password: bcrypt.hashSync('password', salt),
                    organization: 'organization'
                })
                .then(user => {
                    console.log(chalk.green('Initial user has been created, id:', user['_id']));
                    done();
                })
                .catch(done)
        })
    })

    test('Valid login request', async function () {

        const expectedMessage = 'All went successfully';

        const res = await chai
            .request(server)
            .post('/api/users/login')
            .type('json')
            .send({
                email: 'email',
                password: 'password',
            })

        expect(res).to.have.status(httpStatus.OK);
        expect(res).to.be.json;
        assert.strictEqual(res.body.message, expectedMessage);
    })

    test('Missing email property', async function () {

        const expectedMessage = 'error: user email property is not specified';

        const res = await chai
            .request(server)
            .post('/api/users/login')
            .type('json')
            .send({
                password: 'password'
            })

        expect(res).to.have.status(httpStatus.BAD_REQUEST);
        expect(res).to.be.json;
        assert.strictEqual(res.body.message, expectedMessage);
    })

    test('Missing password property', async function () {

        const expectedMessage = 'error: user password property is not specified';

        const res = await chai
            .request(server)
            .post('/api/users/login')
            .type('json')
            .send({
                email: 'email'
            })

        expect(res).to.have.status(httpStatus.BAD_REQUEST);
        expect(res).to.be.json;
        assert.strictEqual(res.body.message, expectedMessage);
    })

    test('Email not present in database', async function () {

        const expectedMessage = 'error: credentials mismatch';

        const res = await chai
            .request(server)
            .post('/api/users/login')
            .type('json')
            .send({
                email: 'email2',
                password: 'password',
            })

        expect(res).to.have.status(httpStatus.UNAUTHORIZED);
        expect(res).to.be.json;
        assert.strictEqual(res.body.message, expectedMessage);
    })

    test('Passwords do not match', async function () {

        const expectedMessage = 'error: credentials mismatch';

        const res = await chai
            .request(server)
            .post('/api/users/login')
            .type('json')
            .send({
                email: 'email',
                password: 'password2',
            })

        expect(res).to.have.status(httpStatus.UNAUTHORIZED);
        expect(res).to.be.json;
        assert.strictEqual(res.body.message, expectedMessage);
    })

    suiteTeardown(async function () {
        await User.deleteMany({});
        await mongoose.connection.close();
    })
})