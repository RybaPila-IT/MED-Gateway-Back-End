const chai = require('chai');
const expect = chai.expect;
const {
    validID
} = require('../../middleware/check');


describe('Test valid ID', function () {

    it('Should return true', function (done) {
       const ID = '537eed02ed345b2e039652d2';
       const result = validID(ID);

       expect(result).to.be.true;
       done();
    });

    it('Should return false', function (done) {
        const IDs = ['hello', 'this_is_not_valid'];

        for (const ID of IDs) {
            const result =  validID(ID);
            expect(result).to.be.false;
        }

        done();

    });

});

