'use strict';

const ALLOWED_DEPOSIT_STATUSES = ['DEPOSITED', 'BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'CANCELLED'];
const ALLOWED_LOAN_STATUSES = ['BORROWED', 'RETURNED', 'OVERDUE', 'CANCELLED'];
const ALLOWED_ACTION_SOURCES = ['WEB_ADMIN', 'RFID_KIOSK', 'SYSTEM'];
const ALLOWED_RETURNED_TO_TYPES = ['STUDENT', 'PARENT', 'GUARDIAN', 'OTHER'];

function ensure(condition, message, errorCode = 'VALIDATION_ERROR', statusCode = 400) {
    if (!condition) {
        const err = new Error(message);
        err.errorCode = errorCode;
        err.statusCode = statusCode;
        throw err;
    }
}

function validateCreateDeposit(payload = {}) {
    ensure(payload.student_id, 'student_id wajib diisi');
    ensure(payload.category_id, 'category_id wajib diisi');
    ensure(payload.item_name, 'item_name wajib diisi');
}

function validateUpdateDeposit(payload = {}) {
    ensure(Object.keys(payload).length > 0, 'Payload update tidak boleh kosong');
}

function validateFinalReturn(payload = {}) {
    ensure(payload.returned_to, 'returned_to wajib diisi');
    ensure(payload.returned_to_type, 'returned_to_type wajib diisi');
    ensure(ALLOWED_RETURNED_TO_TYPES.includes(payload.returned_to_type), 'returned_to_type tidak valid');
}

function validateCategory(payload = {}) {
    ensure(payload.name, 'Nama kategori wajib diisi');
}

module.exports = {
    ensure,
    ALLOWED_DEPOSIT_STATUSES,
    ALLOWED_LOAN_STATUSES,
    ALLOWED_ACTION_SOURCES,
    ALLOWED_RETURNED_TO_TYPES,
    validateCreateDeposit,
    validateUpdateDeposit,
    validateFinalReturn,
    validateCategory
};
