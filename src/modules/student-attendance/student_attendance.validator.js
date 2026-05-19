'use strict';

const SCAN_RESULT_CODES = ['SUCCESS', 'UNKNOWN_CARD', 'DUPLICATE', 'NO_SHIFT', 'REJECTED'];

const ensure = (condition, message, errorCode = 'VALIDATION_ERROR', statusCode = 400) => {
    if (!condition) {
        const err = new Error(message);
        err.errorCode = errorCode;
        err.statusCode = statusCode;
        throw err;
    }
};

const parseTimeToSeconds = (time) => {
    if (!time || typeof time !== 'string') return null;
    const parts = time.split(':').map((value) => parseInt(value, 10));
    if (parts.length < 2 || parts.some(Number.isNaN)) return null;
    const [hour, minute, second = 0] = parts;
    return (hour * 3600) + (minute * 60) + second;
};

const validateDatetime = (value, fieldName) => {
    if (!value) return;
    const normalized = String(value).replace(' ', 'T');
    const parsed = new Date(normalized);
    ensure(!Number.isNaN(parsed.getTime()), `${fieldName} tidak valid`);
};

const validateRfidScanPayload = (payload = {}) => {
    ensure(payload.rfid_code, 'rfid_code wajib diisi');
    ensure(String(payload.rfid_code).trim().length > 0, 'rfid_code wajib diisi');

    if (typeof payload.scanned_at !== 'undefined' && payload.scanned_at !== null && payload.scanned_at !== '') {
        validateDatetime(payload.scanned_at, 'scanned_at');
    }

    ensure(payload.kiosk_token, 'kiosk_token wajib diisi');
};

const validateShiftPayload = (payload = {}, isUpdate = false) => {
    if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'name')) {
        ensure(payload.name, 'name wajib diisi');
    }

    const hasClockInStart = Object.prototype.hasOwnProperty.call(payload, 'clock_in_start');
    const hasLateAfter = Object.prototype.hasOwnProperty.call(payload, 'late_after');
    const hasClockInEnd = Object.prototype.hasOwnProperty.call(payload, 'clock_in_end');

    if (!isUpdate || hasClockInStart) ensure(payload.clock_in_start, 'clock_in_start wajib diisi');
    if (!isUpdate || hasLateAfter) ensure(payload.late_after, 'late_after wajib diisi');
    if (!isUpdate || hasClockInEnd) ensure(payload.clock_in_end, 'clock_in_end wajib diisi');

    const start = parseTimeToSeconds(payload.clock_in_start);
    const late = parseTimeToSeconds(payload.late_after);
    const end = parseTimeToSeconds(payload.clock_in_end);

    if (start !== null && late !== null && end !== null) {
        ensure(start <= late && late <= end, 'clock_in_start <= late_after <= clock_in_end wajib terpenuhi');
    }

    const allowCheckout = Object.prototype.hasOwnProperty.call(payload, 'allow_checkout')
        ? Boolean(payload.allow_checkout)
        : true;

    if (allowCheckout) {
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'clock_out_start')) {
            ensure(payload.clock_out_start, 'clock_out_start wajib diisi saat allow_checkout=true');
        }
    }

    if (payload.clock_out_end && payload.clock_out_start) {
        const outStart = parseTimeToSeconds(payload.clock_out_start);
        const outEnd = parseTimeToSeconds(payload.clock_out_end);
        ensure(outStart !== null && outEnd !== null && outEnd >= outStart, 'clock_out_end harus >= clock_out_start');
    }
};

const validateClassMappingPayload = (payload = {}) => {
    ensure(payload.academic_year_id, 'academic_year_id wajib diisi');
    ensure(payload.class_id, 'class_id wajib diisi');
    ensure(payload.shift_id, 'shift_id wajib diisi');
};

const validateStudentOverridePayload = (payload = {}) => {
    ensure(payload.academic_year_id, 'academic_year_id wajib diisi');
    ensure(payload.student_id, 'student_id wajib diisi');
    ensure(payload.shift_id, 'shift_id wajib diisi');

    if (payload.start_date && payload.end_date) {
        ensure(new Date(payload.start_date) <= new Date(payload.end_date), 'end_date harus lebih besar atau sama dengan start_date');
    }
};

const validateCorrectionPayload = (payload = {}, isUpdate = false) => {
    if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'student_attendance_id')) {
        ensure(payload.student_attendance_id, 'student_attendance_id wajib diisi');
    }
    if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'student_id')) {
        ensure(payload.student_id, 'student_id wajib diisi');
    }
    if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'request_type')) {
        ensure(payload.request_type, 'request_type wajib diisi');
    }

    if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, 'reason')) {
        ensure(payload.reason, 'reason wajib diisi');
    }

    if (payload.requested_clock_in_at) validateDatetime(payload.requested_clock_in_at, 'requested_clock_in_at');
    if (payload.requested_clock_out_at) validateDatetime(payload.requested_clock_out_at, 'requested_clock_out_at');
};

module.exports = {
    SCAN_RESULT_CODES,
    ensure,
    parseTimeToSeconds,
    validateDatetime,
    validateRfidScanPayload,
    validateShiftPayload,
    validateClassMappingPayload,
    validateStudentOverridePayload,
    validateCorrectionPayload
};

