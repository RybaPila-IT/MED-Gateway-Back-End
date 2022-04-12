require('dotenv').config()

const express = require('express');
const mongoose = require("mongoose");
const httpStatus = require('http-status-codes');
const chaiHttp = require('chai-http');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

chai.use(chaiHttp);

const {mongoDbTestUriKey} = require('../../../suppliers/constants');
const setUpMongooseConnection = require('../../../data/connection');
const {
    getProduct,
    getProductsSummary
} = require('../../../controllers/products/get');
const Product = require('../../../data/models/product');

const server = express();

server.use(express.json());
server.use(express.urlencoded({extended: false}));

server.get('/api/products', getProductsSummary);
server.get('/api/products/:productId', getProduct);

//noinspection JSUnusedLocalSymbols
const handleError = (err, req, res, next) => {
    res.status(httpStatus.INTERNAL_SERVER_ERROR);
    res.json({message: err.message});
}

server.use(handleError);

suite('Test get single product controller', function () {

    let _id = 0;

    suiteSetup(function (done) {
        setUpMongooseConnection(mongoDbTestUriKey, () => {
            Product
                .create({
                    name: 'Fetal-Net',
                    short_description: 'Measure fetus body parts with ease',
                    full_description: 'This is full description',
                    picture: 'URL of the picture',
                    usage_description: 'This is usage description'
                })
                .then(product => {
                    _id = product['_id'];
                    done();
                })
                .catch(done)
        })
    })

    test('Get product', async function() {

        const res = await chai
            .request(server)
            .get(`/api/products/${_id}`)

        expect(res).to.have.status(httpStatus.OK);
        expect(res).to.be.json;

        const {body} = res;

        expect(body).to.have.property('_id');
        expect(body).to.have.property('picture');
        expect(body).to.have.property('short_description');
        expect(body).to.have.property('full_description');
        expect(body).to.have.property('usage_description');

        expect(body).to.not.have.property('created_at');
        expect(body).to.not.have.property('updated_at');
        expect(body).to.not.have.property('__v');

        assert.strictEqual(body.name, 'Fetal-Net');
        assert.strictEqual(body.short_description, 'Measure fetus body parts with ease');
        assert.strictEqual(body.full_description, 'This is full description');
        assert.strictEqual(body.picture, 'URL of the picture');
        assert.strictEqual(body.usage_description, 'This is usage description');
    })

    test('Invalid get product request (wrong id)', async function() {

        const expectedErrorMessage = 'error: unable to fetch data for product with id 123';

        const res = await chai
            .request(server)
            .get('/api/products/123')

        expect(res).to.have.status(httpStatus.INTERNAL_SERVER_ERROR);
        expect(res).to.be.json;

        const {body} = res;

        expect(body).to.have.property('message');

        assert.strictEqual(body.message, expectedErrorMessage);
    })

    suiteTeardown(async function() {
        await Product.deleteMany({})
        await mongoose.connection.close();
    })
})


