'use strict';

const allowedValues = {
    extracurricular_type: ['WAJIB', 'PILIHAN', 'PRESTASI'],
    coach_type: ['INTERNAL', 'EXTERNAL'],
    assignment_role: ['KEPALA_PELATIH', 'ASISTEN', 'PENDAMPING'],
    member_status: ['ACTIVE', 'INACTIVE', 'DROPPED', 'GRADUATED', 'MOVED'],
    session_status: ['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED'],
    coach_attendance_status: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'],
    student_attendance_status: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'SICK', 'PERMIT']
};

const ensure = (condition, message) => {
    if (!condition) {
        const err = new Error(message);
        err.statusCode = 400;
        err.errorCode = 'VALIDATION_ERROR';
        throw err;
    }
};

const ensureIn = (value, list, fieldName) => {
    if (value === undefined || value === null || value === '') return;
    ensure(list.includes(value), `${fieldName} tidak valid`);
};

const isEmpty = (value) => value === undefined || value === null || value === '';

const ensureEmailFormat = (email) => {
    if (isEmpty(email)) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    ensure(emailRegex.test(email), 'Format email tidak valid');
};

const validateCoachTypeTransition = (existingCoachType, incomingCoachType) => {
    if (!incomingCoachType) return;
    ensureIn(incomingCoachType, allowedValues.coach_type, 'Tipe pelatih');
    if (!existingCoachType) return;
    ensure(
        existingCoachType === incomingCoachType,
        'Perubahan coach_type INTERNAL <-> EXTERNAL belum didukung. Buat data pelatih baru dengan tipe yang benar.'
    );
};

const validateCreateCoachPayload = (payload = {}) => {
    ensureIn(payload.coach_type, allowedValues.coach_type, 'Tipe pelatih');
    ensure(payload.coach_type, 'Tipe pelatih wajib diisi');

    if (payload.coach_type === 'INTERNAL') {
        ensure(payload.teacher_id, 'Teacher wajib dipilih untuk pelatih INTERNAL');
        ensure(
            isEmpty(payload.password),
            'Password tidak boleh diisi untuk pelatih INTERNAL karena akun mengikuti data guru'
        );
        return;
    }

    ensure(isEmpty(payload.teacher_id), 'teacher_id harus kosong untuk pelatih EXTERNAL');

    const useExistingExternalUser = !!(payload.external_user_id || payload.user_id);
    if (!useExistingExternalUser) {
        ensure(payload.full_name, 'Nama pelatih wajib diisi');
        ensure(payload.email, 'Email wajib diisi untuk pelatih EXTERNAL');
        ensure(payload.password, 'Password awal wajib diisi untuk pelatih EXTERNAL');
        ensure(String(payload.password || '').length >= 6, 'Password minimal 6 karakter');
    }
    ensureEmailFormat(payload.email);
};

const validateUpdateCoachPayload = (payload = {}, existingCoachType) => {
    validateCoachTypeTransition(existingCoachType, payload.coach_type);
    const targetType = payload.coach_type || existingCoachType;
    ensureIn(targetType, allowedValues.coach_type, 'Tipe pelatih');
    ensure(targetType, 'Tipe pelatih wajib tersedia');

    if (targetType === 'INTERNAL') {
        if (Object.prototype.hasOwnProperty.call(payload, 'teacher_id')) {
            ensure(payload.teacher_id, 'Teacher wajib dipilih untuk pelatih INTERNAL');
        }
        ensure(
            isEmpty(payload.password),
            'Password tidak boleh diisi untuk pelatih INTERNAL karena akun mengikuti data guru'
        );
        return;
    }

    ensure(
        !Object.prototype.hasOwnProperty.call(payload, 'teacher_id') || isEmpty(payload.teacher_id),
        'teacher_id harus kosong untuk pelatih EXTERNAL'
    );
    if (!isEmpty(payload.password)) {
        ensure(String(payload.password).length >= 6, 'Password minimal 6 karakter');
    }
    if (!isEmpty(payload.email)) ensureEmailFormat(payload.email);
};

const validateCreateMemberPayload = (payload = {}) => {
    ensure(payload.extracurricular_id, 'extracurricular_id wajib diisi');
    ensure(payload.student_id, 'student_id wajib diisi');
    ensure(payload.academic_year_id, 'academic_year_id wajib diisi');
    ensure(payload.join_date, 'join_date wajib diisi');
};

const validateCreateMembersBulkPayload = (payload = {}) => {
    ensure(payload.extracurricular_id, 'extracurricular_id wajib diisi');
    ensure(payload.academic_year_id, 'academic_year_id wajib diisi');
    ensure(payload.join_date, 'join_date wajib diisi');
    ensure(Array.isArray(payload.student_ids), 'student_ids wajib berupa array');
    ensure(payload.student_ids.length > 0, 'student_ids minimal 1 data');
    ensure(payload.student_ids.every(item => Number.isInteger(parseInt(item, 10))), 'Semua elemen student_ids harus integer');
};

const validateUpdateMemberPayload = (payload = {}) => {
    if (payload.status !== undefined) ensureIn(payload.status, allowedValues.member_status, 'Status anggota');
};

const validateUpdateMemberStatusPayload = (payload = {}) => {
    ensure(payload.status, 'Status wajib diisi');
    ensureIn(payload.status, allowedValues.member_status, 'Status anggota');
};

module.exports = {
    allowedValues,
    ensure,
    ensureIn,
    validateCreateCoachPayload,
    validateUpdateCoachPayload,
    validateCoachTypeTransition,
    validateCreateMemberPayload,
    validateCreateMembersBulkPayload,
    validateUpdateMemberPayload,
    validateUpdateMemberStatusPayload
};
