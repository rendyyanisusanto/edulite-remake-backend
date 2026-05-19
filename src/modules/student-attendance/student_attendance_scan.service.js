'use strict';

const { Op } = require('sequelize');
const db = require('../../models');
const {
    Student,
    AcademicYear,
    StudentClassHistory,
    Class,
    StudentAttendanceShift,
    StudentAttendanceShiftClass,
    StudentAttendanceShiftStudent,
    StudentDailyAttendance,
    StudentAttendanceScanLog
} = db;

const { ensure } = require('./student_attendance.validator');
const { parseScannedAt, toDateOnly, toDateTimeString, combineDateAndTime, calcDiffMinutes } = require('./student_attendance.helper');

class StudentAttendanceScanService {
    sanitizeRfid(value) {
        return String(value || '').trim();
    }

    async writeLog(payload, transaction) {
        return StudentAttendanceScanLog.create(payload, { transaction });
    }

    async getActiveAcademicYear(transaction) {
        return AcademicYear.findOne({ where: { is_active: true }, order: [['id', 'DESC']], transaction });
    }

    async getActiveClass(studentId, academicYearId, transaction) {
        return StudentClassHistory.findOne({
            where: { student_id: studentId, academic_year_id: academicYearId },
            include: [{ model: Class, as: 'class_info', attributes: ['id', 'name'] }],
            order: [['created_at', 'DESC']],
            transaction
        });
    }

    async resolveShift(studentId, classId, academicYearId, attendanceDate, transaction) {
        const studentOverride = await StudentAttendanceShiftStudent.findOne({
            where: {
                student_id: studentId,
                academic_year_id: academicYearId,
                [Op.and]: [
                    {
                        [Op.or]: [
                            { start_date: null },
                            { start_date: { [Op.lte]: attendanceDate } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { end_date: null },
                            { end_date: { [Op.gte]: attendanceDate } }
                        ]
                    }
                ]
            },
            include: [{
                model: StudentAttendanceShift,
                as: 'shift',
                where: {
                    is_active: true,
                    [Op.or]: [{ academic_year_id: academicYearId }, { academic_year_id: null }]
                },
                required: true
            }],
            order: [['id', 'DESC']],
            transaction
        });
        if (studentOverride && studentOverride.shift) return studentOverride.shift;

        if (!classId) return null;

        const classMapping = await StudentAttendanceShiftClass.findOne({
            where: { class_id: classId, academic_year_id: academicYearId },
            include: [{
                model: StudentAttendanceShift,
                as: 'shift',
                where: {
                    is_active: true,
                    [Op.or]: [{ academic_year_id: academicYearId }, { academic_year_id: null }]
                },
                required: true
            }],
            transaction
        });

        return classMapping ? classMapping.shift : null;
    }

    buildFailResponse(message, code, statusCode = 422) {
        return { success: false, message, code, statusCode };
    }

    buildSuccessResponse(message, data, statusCode = 200) {
        return { success: true, message, data, statusCode };
    }

    async scan(payload = {}) {
        const scannedAt = parseScannedAt(payload.scanned_at);
        const attendanceDate = toDateOnly(scannedAt);
        const scannedRfidCode = this.sanitizeRfid(payload.rfid_code);

        return db.sequelize.transaction(async (transaction) => {
            const student = await Student.findOne({
                where: { rfid_code: scannedRfidCode },
                attributes: ['id', 'full_name', 'rfid_code', 'rfid_is_active'],
                transaction
            });

            if (!student || student.rfid_is_active === false) {
                await this.writeLog(
                    {
                        student_id: student ? student.id : null,
                        attendance_id: null,
                        shift_id: null,
                        scanned_rfid_code: scannedRfidCode,
                        scanned_at: scannedAt,
                        scan_type: 'AUTO',
                        result_status: 'UNKNOWN_CARD',
                        result_message: 'Kartu RFID tidak dikenal'
                    },
                    transaction
                );

                return this.buildFailResponse('Kartu RFID tidak dikenal', 'UNKNOWN_CARD', 404);
            }

            const activeAcademicYear = await this.getActiveAcademicYear(transaction);
            ensure(activeAcademicYear, 'Tahun ajaran aktif tidak ditemukan', 'BUSINESS_RULE_ERROR', 422);

            const classHistory = await this.getActiveClass(student.id, activeAcademicYear.id, transaction);
            const classId = classHistory ? classHistory.class_id : null;
            const className = classHistory && classHistory.class_info ? classHistory.class_info.name : '-';

            const shift = await this.resolveShift(student.id, classId, activeAcademicYear.id, attendanceDate, transaction);
            if (!shift) {
                await this.writeLog(
                    {
                        student_id: student.id,
                        attendance_id: null,
                        shift_id: null,
                        scanned_rfid_code: scannedRfidCode,
                        scanned_at: scannedAt,
                        scan_type: 'AUTO',
                        result_status: 'NO_SHIFT',
                        result_message: 'Shift siswa tidak ditemukan'
                    },
                    transaction
                );

                return this.buildFailResponse('Shift siswa tidak ditemukan', 'NO_SHIFT', 422);
            }

            const attendance = await StudentDailyAttendance.findOne({
                where: {
                    student_id: student.id,
                    attendance_date: attendanceDate
                },
                transaction
            });

            if (!attendance) {
                const lateAfterDate = combineDateAndTime(scannedAt, shift.late_after);
                const isLate = lateAfterDate ? scannedAt.getTime() > lateAfterDate.getTime() : false;
                const lateMinutes = isLate ? calcDiffMinutes(lateAfterDate, scannedAt) : 0;

                const created = await StudentDailyAttendance.create(
                    {
                        student_id: student.id,
                        academic_year_id: activeAcademicYear.id,
                        class_id: classId,
                        shift_id: shift.id,
                        attendance_date: attendanceDate,
                        clock_in_at: scannedAt,
                        clock_in_method: 'RFID',
                        entry_status: isLate ? 'LATE' : 'ONTIME',
                        attendance_status: isLate ? 'LATE' : 'PRESENT',
                        late_minutes: lateMinutes
                    },
                    { transaction }
                );

                await this.writeLog(
                    {
                        student_id: student.id,
                        attendance_id: created.id,
                        shift_id: shift.id,
                        scanned_rfid_code: scannedRfidCode,
                        scanned_at: scannedAt,
                        scan_type: 'IN',
                        result_status: 'SUCCESS',
                        result_message: 'Presensi masuk berhasil'
                    },
                    transaction
                );

                return this.buildSuccessResponse('Presensi masuk berhasil', {
                    scan_mode: 'IN',
                    student: {
                        id: student.id,
                        full_name: student.full_name,
                        class_name: className
                    },
                    attendance: {
                        attendance_date: attendanceDate,
                        clock_in_at: toDateTimeString(scannedAt),
                        entry_status: created.entry_status,
                        attendance_status: created.attendance_status,
                        late_minutes: created.late_minutes
                    }
                }, 201);
            }

            if (attendance.clock_in_at && !attendance.clock_out_at) {
                if (!shift.allow_checkout) {
                    await this.writeLog(
                        {
                            student_id: student.id,
                            attendance_id: attendance.id,
                            shift_id: shift.id,
                            scanned_rfid_code: scannedRfidCode,
                            scanned_at: scannedAt,
                            scan_type: 'OUT',
                            result_status: 'REJECTED',
                            result_message: 'Shift tidak mengizinkan presensi pulang'
                        },
                        transaction
                    );
                    return this.buildFailResponse('Shift tidak mengizinkan presensi pulang', 'REJECTED', 422);
                }

                if (!shift.clock_out_start) {
                    await this.writeLog(
                        {
                            student_id: student.id,
                            attendance_id: attendance.id,
                            shift_id: shift.id,
                            scanned_rfid_code: scannedRfidCode,
                            scanned_at: scannedAt,
                            scan_type: 'OUT',
                            result_status: 'REJECTED',
                            result_message: 'Jam pulang belum diatur pada shift'
                        },
                        transaction
                    );
                    return this.buildFailResponse('Jam pulang belum diatur pada shift', 'REJECTED', 422);
                }

                const earliestOut = combineDateAndTime(scannedAt, shift.clock_out_start);
                if (earliestOut && scannedAt.getTime() < earliestOut.getTime()) {
                    await this.writeLog(
                        {
                            student_id: student.id,
                            attendance_id: attendance.id,
                            shift_id: shift.id,
                            scanned_rfid_code: scannedRfidCode,
                            scanned_at: scannedAt,
                            scan_type: 'OUT',
                            result_status: 'REJECTED',
                            result_message: 'Belum waktunya pulang'
                        },
                        transaction
                    );
                    return this.buildFailResponse('Belum waktunya pulang', 'REJECTED', 422);
                }

                await attendance.update(
                    {
                        clock_out_at: scannedAt,
                        clock_out_method: 'RFID',
                        exit_status: 'NORMAL'
                    },
                    { transaction }
                );

                await this.writeLog(
                    {
                        student_id: student.id,
                        attendance_id: attendance.id,
                        shift_id: shift.id,
                        scanned_rfid_code: scannedRfidCode,
                        scanned_at: scannedAt,
                        scan_type: 'OUT',
                        result_status: 'SUCCESS',
                        result_message: 'Presensi pulang berhasil'
                    },
                    transaction
                );

                return this.buildSuccessResponse('Presensi pulang berhasil', {
                    scan_mode: 'OUT',
                    student: {
                        id: student.id,
                        full_name: student.full_name,
                        class_name: className
                    },
                    attendance: {
                        attendance_date: attendanceDate,
                        clock_out_at: toDateTimeString(scannedAt),
                        exit_status: 'NORMAL'
                    }
                });
            }

            await this.writeLog(
                {
                    student_id: student.id,
                    attendance_id: attendance.id,
                    shift_id: shift.id,
                    scanned_rfid_code: scannedRfidCode,
                    scanned_at: scannedAt,
                    scan_type: 'AUTO',
                    result_status: 'DUPLICATE',
                    result_message: 'Scan duplikat pada hari yang sama'
                },
                transaction
            );

            return this.buildFailResponse('Scan duplikat pada hari yang sama', 'DUPLICATE', 409);
        });
    }
}

module.exports = new StudentAttendanceScanService();

