'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentAttendanceScanLog extends Model {
        static associate(models) {
            StudentAttendanceScanLog.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentAttendanceScanLog.belongsTo(models.StudentDailyAttendance, { foreignKey: 'attendance_id', as: 'attendance' });
            StudentAttendanceScanLog.belongsTo(models.StudentAttendanceShift, { foreignKey: 'shift_id', as: 'shift' });
        }
    }

    StudentAttendanceScanLog.init(
        {
            student_id: { type: DataTypes.INTEGER, allowNull: true },
            attendance_id: { type: DataTypes.INTEGER, allowNull: true },
            shift_id: { type: DataTypes.INTEGER, allowNull: true },
            scanned_rfid_code: { type: DataTypes.STRING(100), allowNull: false },
            scanned_at: { type: DataTypes.DATE, allowNull: false },
            scan_type: { type: DataTypes.STRING(20), allowNull: true },
            result_status: { type: DataTypes.STRING(30), allowNull: false },
            result_message: { type: DataTypes.STRING(255), allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentAttendanceScanLog',
            tableName: 'student_attendance_scan_logs',
            updatedAt: false,
            underscored: true
        }
    );

    return StudentAttendanceScanLog;
};

