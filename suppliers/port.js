const {portNumberKey} = require('./constants');

const defaultPort = 3000;

function obtainPort(fallbackPort = defaultPort) {
    const portFromEnv = process.env[portNumberKey];
    if (!portFromEnv) return fallbackPort;
    const parsedPort = parseInt(portFromEnv);
    return isNaN(parsedPort) ? fallbackPort : parsedPort;
}

module.exports = obtainPort;