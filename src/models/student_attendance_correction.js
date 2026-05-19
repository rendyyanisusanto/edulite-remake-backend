'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentAttendanceCorrection extends Model {
        static associate(models) {
            StudentAttendanceCorrection.belongsTo(models.StudentDailyAttendance, { foreignKey: 'student_attendance_id', as: 'attendance' });
            StudentAttendanceCorrection.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentAttendanceCorrection.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
        }
    }

    StudentAttendanceCorrection.init(
        {
            student_attendance_id: { type: DataTypes.INTEGER, allowNull: false },
            student_id: { type: DataTypes.INTEGER, allowNull: false },
            request_type: { type: DataTypes.STRING(30), allowNull: false },
            requested_clock_in_at: { type: DataTypes.DATE, allowNull: true },
            requested_clock_out_at: { type: DataTypes.DATE, allowNull: true },
            reason: { type: DataTypes.TEXT, allowNull: false },
            attachment_file: { type: DataTypes.STRING(255), allowNull: true },
            status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'PENDING' },
            reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
            reviewed_at: { type: DataTypes.DATE, allowNull: true },
            review_note: { type: DataTypes.TEXT, allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentAttendanceCorrection',
            tableName: 'student_attendance_corrections',
            underscored: true
        }
    );

    return StudentAttendanceCorrection;
};

