'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentAttendanceShift extends Model {
        static associate(models) {
            StudentAttendanceShift.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentAttendanceShift.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
            StudentAttendanceShift.hasMany(models.StudentAttendanceShiftClass, { foreignKey: 'shift_id', as: 'class_mappings' });
            StudentAttendanceShift.hasMany(models.StudentAttendanceShiftStudent, { foreignKey: 'shift_id', as: 'student_overrides' });
            StudentAttendanceShift.hasMany(models.StudentDailyAttendance, { foreignKey: 'shift_id', as: 'daily_attendances' });
            StudentAttendanceShift.hasMany(models.StudentAttendanceScanLog, { foreignKey: 'shift_id', as: 'scan_logs' });
        }
    }

    StudentAttendanceShift.init(
        {
            name: { type: DataTypes.STRING(100), allowNull: false },
            code: { type: DataTypes.STRING(50), allowNull: true },
            academic_year_id: { type: DataTypes.INTEGER, allowNull: true },
            clock_in_start: { type: DataTypes.TIME, allowNull: false },
            late_after: { type: DataTypes.TIME, allowNull: false },
            clock_in_end: { type: DataTypes.TIME, allowNull: false },
            clock_out_start: { type: DataTypes.TIME, allowNull: true },
            clock_out_end: { type: DataTypes.TIME, allowNull: true },
            allow_checkout: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            notes: { type: DataTypes.TEXT, allowNull: true },
            updated_by: { type: DataTypes.INTEGER, allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentAttendanceShift',
            tableName: 'student_attendance_shifts',
            underscored: true
        }
    );

    return StudentAttendanceShift;
};

