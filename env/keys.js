module.exports = {
    mongoDbUri: 'MONGO_URI',
    jwtSecret: 'JWT_SECRET',
    dicomConverterAccessToken: 'DICOM_CONVERTER_ACCESS_TOKEN',
    emailUsername: 'EMAIL_USERNAME',
    emailPassword: 'EMAIL_PASSWORD',
    nodeEnv: 'NODE_ENV',
    productsAccessTokens: {
        // Fetal-Net Service
        '625576dda784a265d36ff314': 'FETAL_NET_ACCESS_TOKEN',
        // Baby-Net Service
        '6256a8a79bceb35be10e391e': 'BABY_NET_ACCESS_TOKEN'
    }
};