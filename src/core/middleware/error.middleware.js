const logger = require('../logger');

const errorMiddleware = (err, req, res, next) => {
    logger.error(err.message, { stack: err.stack, path: req.path });

    const statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let errorCode = err.errorCode || 'INTERNAL_ERROR';

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        if (err.errors && err.errors.length > 0) {
            message = err.errors.map(e => e.message).join(', ');
        }
        errorCode = 'VALIDATION_ERROR';
        return res.status(400).json({
            success: false,
            message,
            error_code: errorCode
        });
    }

    res.status(statusCode).json({
        success: false,
        message,
        error_code: errorCode
    });
};

module.exports = { errorMiddleware };
