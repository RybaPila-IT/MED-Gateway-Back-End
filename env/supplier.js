const getParameterValue = (parameterKey) => process.env[parameterKey];

module.exports = getParameterValue;