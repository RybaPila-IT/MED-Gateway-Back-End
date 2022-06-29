const EnvKeys = require('./keys');

const devEndpoints = {
    MedGatewayBackend: 'http://localhost:5000',
    DicomConverter: 'http://localhost:8000',
    Products: {
        // Fetal-Net Service
        '625576dda784a265d36ff314': 'http://localhost:7000',
        // Baby-Net Service
        '6256a8a79bceb35be10e391e': 'http://localhost:1000'
    }
}


const prodEndpoints = {
    MedGatewayBackend: 'https://med-gateway-backend.herokuapp.com',
    DicomConverter: 'https://med-dicom-converter.herokuapp.com',
    Products: {
        // Fetal-Net Service
        '625576dda784a265d36ff314': 'https://fetal-net-service-hsyhifhtpq-lm.a.run.app',
        // Baby-Net Service
        '6256a8a79bceb35be10e391e': 'http://localhost:5000'
    }
}

module.exports = process.env[EnvKeys.nodeEnv] === 'production' ? prodEndpoints : devEndpoints;