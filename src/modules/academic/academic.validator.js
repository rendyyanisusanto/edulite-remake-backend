'use strict';

const SUBJECT_TYPES = ['UMUM', 'KEJURUAN', 'MUATAN_LOKAL', 'EKSTRA'];
const PERIOD_TYPES = ['LESSON', 'BREAK', 'ASSEMBLY', 'PRAYER', 'ACTIVITY'];

const ensure = (condition, message, errorCode = 'VALIDATION_ERROR', statusCode = 400) => {
    if (!condition) {
        const err = new Error(message);
        err.errorCode = errorCode;
        err.statusCode = statusCode;
        throw err;
    }
};

const parseTimeToMinutes = (value) => {
    if (!value || typeof value !== 'string') return null;
    const parts = value.split(':').map((item) => parseInt(item, 10));
    if (parts.length < 2 || parts.some(Number.isNaN)) return null;
    return (parts[0] * 60) + parts[1];
};

module.exports = {
    SUBJECT_TYPES,
    PERIOD_TYPES,
    ensure,
    parseTimeToMinutes
};

