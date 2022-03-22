const chai = require('chai');
const assert = chai.assert;

const obtainPort = require('../bin/port');

suite('Test obtainPort', () => {
   test('No port supplied', () => {
       const supplier = () => {};
       const fallbackPort = 3000;
       const expectedPort = fallbackPort;
       const obtainedPort = obtainPort(supplier, fallbackPort);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
   test('Correct port supplied', () => {
       const supplier = () => '42';
       const expectedPort = 42;
       const obtainedPort = obtainPort(supplier);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
   test('Incorrect port supplied', () => {
       const supplier = () => 'not a valid port';
       const fallbackPort = 3000;
       const expectedPort = fallbackPort;
       const obtainedPort = obtainPort(supplier, fallbackPort);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
});