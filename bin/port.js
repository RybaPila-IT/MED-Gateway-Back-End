const envParameterSupplier = require('../env/supplier');

const portNumberKey = 'PORT';
const defaultPort = 3000;

function obtainPort(
    supplier = envParameterSupplier,
    fallbackPort = defaultPort
) {
    const portFromEnv = supplier(portNumberKey);
    if (!portFromEnv) return fallbackPort;
    const parsedPort = parseInt(portFromEnv);
    return isNaN(parsedPort) ? fallbackPort : parsedPort;
}

module.exports = obtainPort;