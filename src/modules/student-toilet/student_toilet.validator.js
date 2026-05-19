'use strict';

const ensure = (condition, message, errorCode = 'VALIDATION_ERROR', statusCode = 400) => {
    if (!condition) {
        const err = new Error(message);
        err.errorCode = errorCode;
        err.statusCode = statusCode;
        throw err;
    }
};

const validateDatetime = (value, fieldName) => {
    if (!value) return;
    const normalized = String(value).replace(' ', 'T');
    const parsed = new Date(normalized);
    ensure(!Number.isNaN(parsed.getTime()), `${fieldName} tidak valid`);
};

const validateToiletScanPayload = (payload = {}) => {
    ensure(payload.rfid_code, 'rfid_code wajib diisi');
    ensure(String(payload.rfid_code).trim().length > 0, 'rfid_code wajib diisi');

    if (typeof payload.scanned_at !== 'undefined' && payload.scanned_at !== null && payload.scanned_at !== '') {
        validateDatetime(payload.scanned_at, 'scanned_at');
    }

    ensure(payload.kiosk_token, 'kiosk_token wajib diisi');
};

module.exports = {
    ensure,
    validateDatetime,
    validateToiletScanPayload
};

