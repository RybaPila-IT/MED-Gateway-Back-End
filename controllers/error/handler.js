const httpStatus = require('http-status-codes');

const onError = (err, req, res, _) => {
    if (res.statusCode === httpStatus.OK) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
    }
    // Send the json response after optional status code setting.
    res
        .json({
            message: err.message
        });
}

module.exports = onError;