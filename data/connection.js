const chalk = require('chalk');
const mongoose = require('mongoose');

function setUpMongooseConnection(uriKey, callback = () => {}) {
    const makeInitialMongooseConnection = () => {
        mongoose
            .connect(process.env[uriKey])
            .then(() => {
                console.log(chalk.magenta('Successfully connected to Mongo database'));
                callback();
            })
            .catch(err => {
                console.log(chalk.red('Error while connecting to Mongo database', err.message));
            })
    }
    const setUpMongooseEventListeners = () => {
        mongoose.connection.on('error', err => {
            console.log(chalk.red('Mongoose error:', err));
        });
        mongoose.connection.on('disconnected', () => {
            console.log(chalk.magenta('Disconnected from Mongo database'));
        });
    }
    makeInitialMongooseConnection();
    setUpMongooseEventListeners();
}

module.exports = setUpMongooseConnection;