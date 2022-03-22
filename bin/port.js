const envParameterSupplier = require('../env/supplier');

const portNumberKey = 'PORT';
const defaultPort = 3000;

function obtainPort(supplier = envParameterSupplier) {
    const portFromEnv = supplier(portNumberKey);
    if (!portFromEnv) return defaultPort;
    const parsedPort = parseInt(portFromEnv);
    return isNaN(parsedPort) ? defaultPort : parsedPort;
}

module.exports = obtainPort;