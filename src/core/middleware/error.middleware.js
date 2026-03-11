const logger = require('../logger');

const errorMiddleware = (err, req, res, next) => {
    logger.error(err.message, { stack: err.stack, path: req.path });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const errorCode = err.errorCode || 'INTERNAL_ERROR';

    res.status(statusCode).json({
        success: false,
        message,
        error_code: errorCode
    });
};

module.exports = { errorMiddleware };
