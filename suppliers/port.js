const envParameterSupply = require('./envParameters');

const portNumberKey = 'PORT';
const defaultPort = 3000;

function obtainPort(
    supply = envParameterSupply,
    fallbackPort = defaultPort
) {
    const portFromEnv = supply(portNumberKey);
    if (!portFromEnv) return fallbackPort;
    const parsedPort = parseInt(portFromEnv);
    return isNaN(parsedPort) ? fallbackPort : parsedPort;
}

module.exports = obtainPort;