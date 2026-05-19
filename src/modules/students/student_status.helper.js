'use strict';

const { Student } = require('../../models');

const ACTIVE_STATUSES = ['ACTIVE'];

const ensureStudentActiveForTransaction = async (studentId, customMessage = null) => {
    const student = await Student.findByPk(studentId, {
        attributes: ['id', 'full_name', 'student_status']
    });

    if (!student) {
        const err = new Error('Siswa tidak ditemukan');
        err.statusCode = 404;
        err.errorCode = 'NOT_FOUND';
        throw err;
    }

    if (!ACTIVE_STATUSES.includes(student.student_status || 'ACTIVE')) {
        const err = new Error(
            customMessage || `Siswa ${student.full_name} tidak aktif untuk transaksi baru (status: ${student.student_status})`
        );
        err.statusCode = 422;
        err.errorCode = 'STUDENT_NOT_ACTIVE';
        throw err;
    }

    return student;
};

module.exports = {
    ACTIVE_STATUSES,
    ensureStudentActiveForTransaction
};
