const chai = require('chai');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');
const {
    createContext
} = require('../../middleware/context');


describe('Test create context', function () {

    it('Should set empty context in req', function (done) {
        const {req, res} = httpMocks.createMocks();

        createContext(req, res, function () {
            expect(req).to.have.property('context');
            expect(req.context).to.be.deep.equal({});
            done();
        });
    });

});

