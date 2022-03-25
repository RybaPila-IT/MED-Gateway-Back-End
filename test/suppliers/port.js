const chai = require('chai');
const assert = chai.assert;

const obtainPort = require('../../suppliers/port');

suite('Test obtainPort', () => {
   test('No port supplied', () => {
       const supply = () => {};
       const fallbackPort = 3000;
       const expectedPort = fallbackPort;
       const obtainedPort = obtainPort(supply, fallbackPort);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
   test('Correct port supplied', () => {
       const supply = () => '42';
       const expectedPort = 42;
       const obtainedPort = obtainPort(supply);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
   test('Incorrect port supplied', () => {
       const supply = () => 'not a valid port';
       const fallbackPort = 3000;
       const expectedPort = fallbackPort;
       const obtainedPort = obtainPort(supply, fallbackPort);
       assert.strictEqual(obtainedPort, expectedPort, `Expected: ${expectedPort} but is ${obtainedPort}`);
   })
});