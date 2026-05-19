'use strict';

const MUTATION_TYPES = ['IN', 'OUT'];
const MUTATION_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
const OPEN_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED'];

const ensure = (condition, message, errorCode = 'VALIDATION_ERROR', statusCode = 400) => {
    if (!condition) {
        const err = new Error(message);
        err.errorCode = errorCode;
        err.statusCode = statusCode;
        throw err;
    }
};

const ensureEnum = (value, allowed, fieldName) => {
    ensure(allowed.includes(value), `${fieldName} tidak valid`);
};

const ensureDateSequence = (mutationDate, effectiveDate) => {
    if (!mutationDate || !effectiveDate) return;
    ensure(
        new Date(effectiveDate).getTime() >= new Date(mutationDate).getTime(),
        'Tanggal efektif tidak boleh lebih awal dari tanggal mutasi'
    );
};

const validateMutationPayload = (payload = {}, isUpdate = false) => {
    const requiredFields = ['student_id', 'mutation_type', 'mutation_category', 'mutation_date', 'effective_date', 'reason'];

    for (const field of requiredFields) {
        if (!isUpdate || Object.prototype.hasOwnProperty.call(payload, field)) {
            ensure(payload[field], `${field} wajib diisi`);
        }
    }

    if (payload.mutation_type) {
        ensureEnum(payload.mutation_type, MUTATION_TYPES, 'Jenis mutasi');
    }

    if (payload.mutation_type === 'OUT' && payload.mutation_category === 'TRANSFER') {
        ensure(payload.destination_school, 'Sekolah tujuan wajib diisi untuk mutasi keluar TRANSFER');
    }

    if (payload.mutation_type === 'IN') {
        ensure(payload.origin_school, 'Sekolah asal wajib diisi untuk mutasi masuk');
    }

    ensureDateSequence(payload.mutation_date, payload.effective_date);
};

const validateActionStatus = (currentStatus, allowedStatuses, actionLabel) => {
    ensure(
        allowedStatuses.includes(currentStatus),
        `Status mutasi tidak valid untuk aksi ${actionLabel}. Status saat ini: ${currentStatus}`,
        'INVALID_STATUS_TRANSITION',
        422
    );
};

module.exports = {
    MUTATION_TYPES,
    MUTATION_STATUSES,
    OPEN_STATUSES,
    ensure,
    ensureEnum,
    validateMutationPayload,
    validateActionStatus
};
