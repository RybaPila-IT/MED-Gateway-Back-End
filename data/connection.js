const mongoose = require('mongoose');
const log = require('npmlog');

const EnvKeys = require('../env/keys');

function setUpConnection(callback = _ => {}) {
    const mongoURI = process.env[EnvKeys.mongoDbUri];
    mongoose.connect(mongoURI)
        .then(_ => {
            // Setting up listeners for mongoose events.
            mongoose.connection.on('error', err => {
                log.log('error', 'MONGOOSE', 'Mongoose error:', err)
            });
            mongoose.connection.on('disconnected', _ => {
                log.log('warn', 'MONGOOSE', 'Disconnected from Mongo database');
            });
            log.log('info', 'MONGOOSE', 'Successfully connected to MongoDB database');
            // Executing user callback.
            callback();
        })
        .catch(err => {
            log.log('error', 'MONGOOSE', 'Mongo connection error:', err.message);
        })
}

module.exports = setUpConnection;