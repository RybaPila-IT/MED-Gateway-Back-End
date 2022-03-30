require('dotenv').config();

const express = require('express');
const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;

chai.use(chaiHttp);

const {jwtSecretKey} = require('../../../suppliers/constants')
const authenticateUserMiddlewarePipeline = require('../../../middleware/users/authenticate');

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.post('/api/users/me',
    ...authenticateUserMiddlewarePipeline,
    (req, res) => {
        res.status(httpStatus.OK).json({
            message: 'Successfully authenticated user',
            decoded_token: req['token']
        })
    }
)

const handleError = (err, req, res, next) => {
    res.json({message: err.message});
}

server.use(handleError);


suite('Test authenticate middleware pipeline', function () {

    test('Valid request with authentication', async function () {
        const payload = {
            _id: '651088hfl1233s233',
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
                data: 'This is not important data'
            })

        expect(res).to.have.status(httpStatus.OK);
        expect(res).to.be.json;

        const {body} = res;

        expect(body).to.have.property('message');
        expect(body).to.have.property('decoded_token');

        assert.strictEqual(body.message, 'Successfully authenticated user');
        assert.strictEqual(body.decoded_token._id, payload._id);
        assert.strictEqual(body.decoded_token.status, payload.status);
        assert.strictEqual(body.decoded_token.permission, payload.permission);
    });

    test('Web token is corrupted (invalid signature)', async function() {
        const payload = {
            _id: '651088hfl1233s233',
            status: 'unverified',
            permission: 'user'
        }
        // Below WebStorm complained about wrong signature, but I used
        // 'verify' correctly in a synchronous way.
        // noinspection JSCheckFunctionSignatures
        const token = jwt.sign(payload, jwtSecretKey, {expiresIn: '2h'})
        const res = await chai
            .request(server)
            .post('/api/users/me')
            .type('json')
            .auth(token, {type: 'bearer'})
            .send({
                data: 'This is not important data'
            })

        expect(res).to.have.status(httpStatus.NOT_FOUND);
        expect(res).to.be.json;
        expect(res.body).to.have.property('message');

        assert.strictEqual(res.body.message, 'Page not found');
    })

    test('Missing authorization header', async function() {
        const res = await chai
            .request(server)
            .post('/api/users/me')
            .type('json')
            .send({
                data: 'This is not important data'
            })

        expect(res).to.have.status(httpStatus.NOT_FOUND);
        expect(res).to.be.json;
        expect(res.body).to.have.property('message');

        assert.strictEqual(res.body.message, 'Page not found');
    })

    test('Wrong authorization mode (with user/password)', async function() {
        const payload = {
            _id: '651088hfl1233s233',
            status: 'unverified',
            permission: 'user'
        }
        // Below WebStorm complained about wrong signature, but I used
        // 'verify' correctly in a synchronous way.
        // noinspection JSCheckFunctionSignatures
        const token = jwt.sign(payload, jwtSecretKey, {expiresIn: '2h'})
        const res = await chai
            .request(server)
            .post('/api/users/me')
            .type('json')
            .auth('user', token)
            .send({
                data: 'This is not important data'
            })

        expect(res).to.have.status(httpStatus.NOT_FOUND);
        expect(res).to.be.json;
        expect(res.body).to.have.property('message');

        assert.strictEqual(res.body.message, 'Page not found');
    })
})


