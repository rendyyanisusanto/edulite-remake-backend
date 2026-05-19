'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentDailyAttendance extends Model {
        static associate(models) {
            StudentDailyAttendance.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentDailyAttendance.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentDailyAttendance.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class_info' });
            StudentDailyAttendance.belongsTo(models.StudentAttendanceShift, { foreignKey: 'shift_id', as: 'shift' });
            StudentDailyAttendance.hasMany(models.StudentAttendanceScanLog, { foreignKey: 'attendance_id', as: 'scan_logs' });
            StudentDailyAttendance.hasMany(models.StudentAttendanceCorrection, { foreignKey: 'student_attendance_id', as: 'corrections' });
        }
    }

    StudentDailyAttendance.init(
        {
            student_id: { type: DataTypes.INTEGER, allowNull: false },
            academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
            class_id: { type: DataTypes.INTEGER, allowNull: true },
            shift_id: { type: DataTypes.INTEGER, allowNull: true },
            attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
            clock_in_at: { type: DataTypes.DATE, allowNull: true },
            clock_out_at: { type: DataTypes.DATE, allowNull: true },
            clock_in_method: { type: DataTypes.STRING(30), allowNull: true },
            clock_out_method: { type: DataTypes.STRING(30), allowNull: true },
            entry_status: { type: DataTypes.STRING(20), allowNull: true },
            exit_status: { type: DataTypes.STRING(20), allowNull: true },
            attendance_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'INCOMPLETE' },
            late_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            note: { type: DataTypes.TEXT, allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentDailyAttendance',
            tableName: 'student_daily_attendances',
            underscored: true
        }
    );

    return StudentDailyAttendance;
};

