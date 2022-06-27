const EnvKeys = require('./keys');

const devEndpoints = {
    MedGatewayBackend: 'http://localhost/5000',
    DicomConverter: 'http://localhost:5000',
    Products: {
        // Fetal-Net Service
        '625576dda784a265d36ff314': 'http://localhost:5000',
        // Baby-Net Service
        '6256a8a79bceb35be10e391e': 'http://localhost:5000'
    }
}

// TODO (radek.r) Set valid production endpoints.
const prodEndpoints = {
    MedGatewayBackend: 'http://localhost/5000',
    DicomConverter: 'http://localhost:5000',
    Products: {
        // Fetal-Net Service
        '625576dda784a265d36ff314': 'http://localhost:5000',
        // Baby-Net Service
        '6256a8a79bceb35be10e391e': 'http://localhost:5000'
    }
}

module.exports = process.env[EnvKeys.nodeEnv] === 'production' ? prodEndpoints : devEndpoints;