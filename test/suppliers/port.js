const chai = require('chai');
const assert = chai.assert;
const {portNumberKey} = require('../../suppliers/constants');

const obtainPort = require('../../suppliers/port');

suite('Test obtainPort', () => {
   test('No port supplied', () => {
       delete process.env[portNumberKey];
       const fallbackPort = 3000;
       const expectedPort = fallbackPort;
       const obtainedPort = obtainPort(fallbackPort);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
   test('Correct port supplied', () => {
       process.env[portNumberKey] = '42';
       const expectedPort = 42;
       const obtainedPort = obtainPort();
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
   test('Incorrect port supplied', () => {
       process.env[portNumberKey] = 'not a valid port';
       const fallbackPort = 3000;
       const expectedPort = fallbackPort;
       const obtainedPort = obtainPort(fallbackPort);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
});