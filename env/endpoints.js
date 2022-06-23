const EnvKeys = require('./keys');

const devEndpoints = {
    MedGatewayBackend: 'http://localhost/5000',
    DicomConverter: 'http://localhost:5000',
    FetalNetService: 'http://localhost:5000'
}

const prodEndpoints = {
    MedGatewayBackend: 'http://localhost/5000',
    DicomConverter: 'http://localhost:5000',
    FetalNetService: 'http://localhost:5000'
}

module.exports = process.env[EnvKeys.nodeEnv] === 'production' ? prodEndpoints : devEndpoints;