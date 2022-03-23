const httpStatus = require('http-status-codes');

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode !== httpStatus.OK ?
        res.statusCode :
        httpStatus.INTERNAL_SERVER_ERROR;

    res
        .status(statusCode)
        .json({
            message: err.message
        });
}

module.exports = {
    errorHandler
}