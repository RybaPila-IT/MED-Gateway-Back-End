const chalk = require('chalk');
const mongoose = require('mongoose');

function setUpMongooseConnection(uriKey, callback = () => {}) {
    const makeInitialMongooseConnection = () => {
        mongoose
            .connect(process.env[uriKey])
            .then(() => {
                console.log(chalk.magenta('Successfully connected to Mongo DB database'));
                callback();
            })
            .catch(err => {
                console.log(chalk.red('Error while connecting to Mongo DB database', err.message));
            })
    }
    const setUpMongooseEventListeners = () => {
        mongoose.connection.on('error', err => {
            console.log(chalk.red('mongoose error:', err));
        });
        mongoose.connection.on('disconnected', () => {
            console.log(chalk.magenta('Disconnected from mongoose server'));
        });
    }
    makeInitialMongooseConnection();
    setUpMongooseEventListeners();
}

module.exports = setUpMongooseConnection;