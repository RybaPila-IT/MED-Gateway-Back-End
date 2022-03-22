const chalk = require('chalk');
const mongoose = require('mongoose');

function setUpMongooseConnection(callback = () => {}) {
    const makeInitialMongooseConnection = () => {
        mongoose
            .connect(process.env.MONGO_URI)
            .then(() => {
                  console.log(chalk.green('Successfully connected to Mongo DB database'));
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