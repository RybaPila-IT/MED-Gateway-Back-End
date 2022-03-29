const express = require('express');
const httpStatus = require('http-status-codes');
const chaiHttp = require('chai-http');
const chai = require('chai');
const bcrypt = require('bcrypt');
const assert = chai.assert;
const expect = chai.expect;

chai.use(chaiHttp);

const registerUserMiddlewarePipeline = require('../../../middleware/users/register');

const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: false }));

server.post('/api/users/register',
    ...registerUserMiddlewarePipeline,
    (req, res) => {
        res.status(httpStatus.OK).json({
            ...req.body
        })
    }
)

const handleError = (err, req, res, next) => {
    res.json({message: err.message});
}

server.use(handleError);


suite('Test register middleware pipeline', () => {

    const requestData = {
        name: 'name',
        surname: 'surname',
        email: 'email',
        password: 'password',
        organization: 'organization'
    }

    test('Valid registration request', (done) => {
        chai
            .request(server)
            .post('/api/users/register')
            .type('json')
            .send(requestData)
            .end((err, res) => {
                expect(err).to.be.null;
                expect(res).to.have.status(httpStatus.OK);
                expect(res).to.be.json;
                assert.strictEqual(res.body.name, requestData['name']);
                assert.strictEqual(res.body.surname, requestData['surname']);
                assert.strictEqual(res.body.email, requestData['email']);
                assert.strictEqual(res.body.organization, requestData['organization']);
                assert.isTrue(bcrypt.compareSync(requestData['password'], res.body.password));
                done();
            })
    });

    test('Missing any of the fields', (done) => {

        let i = 0;

        for (const key in requestData) {

            let missingRequestData = Object.assign({}, requestData);
            delete missingRequestData[key];

            // Use i as the counter to know, how many tests started execution.
            i++;

            chai
                .request(server)
                .post('/api/users/register')
                .type('json')
                .send(missingRequestData)
                .end((err, res) => {
                    expect(err).to.be.null;
                    expect(res).to.have.status(httpStatus.BAD_REQUEST);
                    expect(res).to.be.json;
                    expect(res).to.have.property('body');
                    expect(res.body).to.have.property('message');
                    // If we are the last test to finish execution, call done function.
                    if (--i === 0) {
                        done();
                    }
                })
        }

    });
})



