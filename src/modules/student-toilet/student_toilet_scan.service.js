'use strict';

const db = require('../../models');
const {
    Student,
    AcademicYear,
    StudentClassHistory,
    Class,
    StudentToiletPermission,
    StudentToiletScanLog
} = db;

const { ensure } = require('./student_toilet.validator');
const { parseScannedAt, toDateOnly, toDateTimeString, calcDiffMinutes } = require('../student-attendance/student_attendance.helper');

class StudentToiletScanService {
    sanitizeRfid(value) {
        return String(value || '').trim();
    }

    async writeLog(payload, transaction) {
        return StudentToiletScanLog.create(payload, { transaction });
    }

    buildFailResponse(message, code, statusCode = 422) {
        return { success: false, message, code, statusCode };
    }

    buildSuccessResponse(message, data, statusCode = 200) {
        return { success: true, message, data, statusCode };
    }

    async scan(payload = {}) {
        const scannedAt = parseScannedAt(payload.scanned_at);
        const scannedDate = toDateOnly(scannedAt);
        const scannedRfidCode = this.sanitizeRfid(payload.rfid_code);

        return db.sequelize.transaction(async (transaction) => {
            const student = await Student.findOne({
                where: { rfid_code: scannedRfidCode },
                attributes: ['id', 'full_name', 'rfid_is_active'],
                transaction
            });

            if (!student || student.rfid_is_active === false) {
                await this.writeLog(
                    {
                        student_id: student ? student.id : null,
                        toilet_permission_id: null,
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

            const activeAcademicYear = await AcademicYear.findOne({ where: { is_active: true }, order: [['id', 'DESC']], transaction });
            ensure(activeAcademicYear, 'Tahun ajaran aktif tidak ditemukan', 'BUSINESS_RULE_ERROR', 422);

            const classHistory = await StudentClassHistory.findOne({
                where: {
                    student_id: student.id,
                    academic_year_id: activeAcademicYear.id
                },
                include: [{ model: Class, as: 'class_info', attributes: ['id', 'name'] }],
                order: [['created_at', 'DESC']],
                transaction
            });

            const classId = classHistory ? classHistory.class_id : null;
            const className = classHistory && classHistory.class_info ? classHistory.class_info.name : '-';

            const activeTrip = await StudentToiletPermission.findOne({
                where: {
                    student_id: student.id,
                    permission_date: scannedDate,
                    status: 'OUT'
                },
                order: [['id', 'DESC']],
                transaction
            });

            if (!activeTrip) {
                const created = await StudentToiletPermission.create(
                    {
                        student_id: student.id,
                        academic_year_id: activeAcademicYear.id,
                        class_id: classId,
                        permission_date: scannedDate,
                        exit_at: scannedAt,
                        status: 'OUT'
                    },
                    { transaction }
                );

                await this.writeLog(
                    {
                        student_id: student.id,
                        toilet_permission_id: created.id,
                        scanned_rfid_code: scannedRfidCode,
                        scanned_at: scannedAt,
                        scan_type: 'OUT',
                        result_status: 'SUCCESS',
                        result_message: 'Siswa keluar ke toilet'
                    },
                    transaction
                );

                return this.buildSuccessResponse('Siswa keluar ke toilet', {
                    scan_mode: 'OUT',
                    student: {
                        id: student.id,
                        full_name: student.full_name,
                        class_name: className
                    },
                    toilet_permission: {
                        id: created.id,
                        permission_date: created.permission_date,
                        exit_at: toDateTimeString(scannedAt),
                        status: created.status
                    }
                }, 201);
            }

            if (activeTrip.status === 'OUT') {
                const durationMinutes = activeTrip.exit_at ? calcDiffMinutes(new Date(activeTrip.exit_at), scannedAt) : 0;

                await activeTrip.update(
                    {
                        return_at: scannedAt,
                        duration_minutes: durationMinutes,
                        status: 'RETURNED'
                    },
                    { transaction }
                );

                await this.writeLog(
                    {
                        student_id: student.id,
                        toilet_permission_id: activeTrip.id,
                        scanned_rfid_code: scannedRfidCode,
                        scanned_at: scannedAt,
                        scan_type: 'RETURN',
                        result_status: 'SUCCESS',
                        result_message: 'Siswa kembali dari toilet'
                    },
                    transaction
                );

                const totalTripsToday = await StudentToiletPermission.count({
                    where: { student_id: student.id, permission_date: scannedDate },
                    transaction
                });

                return this.buildSuccessResponse('Siswa kembali dari toilet', {
                    scan_mode: 'RETURN',
                    student: {
                        id: student.id,
                        full_name: student.full_name,
                        class_name: className
                    },
                    toilet_permission: {
                        id: activeTrip.id,
                        permission_date: activeTrip.permission_date,
                        exit_at: activeTrip.exit_at ? toDateTimeString(new Date(activeTrip.exit_at)) : null,
                        return_at: toDateTimeString(scannedAt),
                        duration_minutes: durationMinutes,
                        status: 'RETURNED'
                    },
                    summary_today: {
                        total_trips: totalTripsToday
                    }
                });
            }

            await this.writeLog(
                {
                    student_id: student.id,
                    toilet_permission_id: activeTrip.id,
                    scanned_rfid_code: scannedRfidCode,
                    scanned_at: scannedAt,
                    scan_type: 'AUTO',
                    result_status: 'REJECTED',
                    result_message: 'Kondisi scan toilet tidak valid'
                },
                transaction
            );

            return this.buildFailResponse('Kondisi scan toilet tidak valid', 'REJECTED', 422);
        });
    }
}

module.exports = new StudentToiletScanService();

