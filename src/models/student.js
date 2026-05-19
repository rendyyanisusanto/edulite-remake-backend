'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Student extends Model {
        static associate(models) {
            Student.hasMany(models.ParentProfile, { foreignKey: 'student_id', as: 'parents' });
            Student.hasMany(models.StudentDocument, { foreignKey: 'student_id', as: 'documents' });
            Student.hasMany(models.StudentClassHistory, { foreignKey: 'student_id', as: 'class_history' });
            Student.hasMany(models.StudentMutation, { foreignKey: 'student_id', as: 'mutations' });
            Student.hasMany(models.StudentViolation, { foreignKey: 'student_id', as: 'violations' });
            Student.hasMany(models.CounselingCase, { foreignKey: 'student_id', as: 'counseling_cases' });
            Student.hasMany(models.ExtracurricularRegistration, { foreignKey: 'student_id', as: 'extracurricular_registrations' });
            Student.hasMany(models.ExtracurricularMember, { foreignKey: 'student_id', as: 'extracurricular_memberships' });
            Student.hasMany(models.ExtracurricularStudentAttendance, { foreignKey: 'student_id', as: 'extracurricular_attendances' });
            Student.hasMany(models.ExtracurricularStudentProgress, { foreignKey: 'student_id', as: 'extracurricular_progresses' });
            Student.hasMany(models.StudentAttendanceShiftStudent, { foreignKey: 'student_id', as: 'attendance_shift_overrides' });
            Student.hasMany(models.StudentDailyAttendance, { foreignKey: 'student_id', as: 'daily_attendances' });
            Student.hasMany(models.StudentAttendanceScanLog, { foreignKey: 'student_id', as: 'attendance_scan_logs' });
            Student.hasMany(models.StudentAttendanceCorrection, { foreignKey: 'student_id', as: 'attendance_corrections' });
            Student.hasMany(models.StudentToiletPermission, { foreignKey: 'student_id', as: 'toilet_permissions' });
            Student.hasMany(models.StudentToiletScanLog, { foreignKey: 'student_id', as: 'toilet_scan_logs' });
            Student.hasMany(models.StudentItemDeposit, { foreignKey: 'student_id', as: 'item_deposits' });
            Student.hasMany(models.StudentItemLoan, { foreignKey: 'student_id', as: 'item_loans' });
        }
    }
    Student.init({
        nis: {
            type: DataTypes.STRING(50)
        },
        nisn: {
            type: DataTypes.STRING(50)
        },
        full_name: {
            type: DataTypes.STRING(100)
        },
        gender: {
            type: DataTypes.STRING(10)
        },
        date_of_birth: {
            type: DataTypes.DATEONLY
        },
        address: {
            type: DataTypes.TEXT
        },
        rfid_code: {
            type: DataTypes.STRING(100)
        },
        rfid_is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        rfid_assigned_at: {
            type: DataTypes.DATE
        },
        qr_code: {
            type: DataTypes.STRING(255)
        },
        barcode: {
            type: DataTypes.STRING(100)
        },
        card_template_id: {
            type: DataTypes.INTEGER
        },
        card_number: {
            type: DataTypes.STRING(100)
        },
        photo: {
            type: DataTypes.STRING(255)
        },
        student_status: {
            type: DataTypes.STRING(30),
            defaultValue: 'ACTIVE'
        }
    }, {
        sequelize,
        modelName: 'Student',
        tableName: 'students',
        underscored: true,
    });
    return Student;
};
