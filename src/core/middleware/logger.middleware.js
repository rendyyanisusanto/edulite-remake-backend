const logger = require('../logger');

const redactUrl = (url) => {
    if (!url) return url;
    return String(url).replace(
        /(\/public\/lesson-attendance\/classes\/)([^/?#]+)/gi,
        '$1[REDACTED]'
    );
};

const loggerMiddleware = (req, res, next) => {
    logger.info(`[${req.method}] ${redactUrl(req.originalUrl)}`);
    next();
};

module.exports = { loggerMiddleware };
