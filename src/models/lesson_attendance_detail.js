'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LessonAttendanceDetail extends Model {
        static associate(models) {
            LessonAttendanceDetail.belongsTo(models.LessonAttendanceSession, { foreignKey: 'session_id', as: 'session' });
            LessonAttendanceDetail.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
        }
    }

    LessonAttendanceDetail.init({
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        session_id: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'),
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'LessonAttendanceDetail',
        tableName: 'lesson_attendance_details',
        underscored: true
    });

    return LessonAttendanceDetail;
};
