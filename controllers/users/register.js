const httpStatus = require('http-status-codes');
const chalk = require('chalk');

const registerUserMiddlewarePipeline = require('../../middleware/users/register');
const User = require('../../data/models/user');


const tryRegisterUser = (req, res, next) => {
    const {name, surname, email, password, organization} = req.body;

    User
        .create({
            name,
            surname,
            email,
            password,
            organization
        })
        .then(createdUser => {
          res
              .status(httpStatus.CREATED)
              .json({
                  ...createdUser['_doc']
              });
        })
        .catch(err => {
            console.log(chalk.red('error: creating the user', err.message));
            next(new Error('error: creating user'));
        })
}

const registerUser = [
        ...registerUserMiddlewarePipeline,
    tryRegisterUser
];

module.exports = registerUser;