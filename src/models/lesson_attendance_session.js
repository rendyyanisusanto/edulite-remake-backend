'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LessonAttendanceSession extends Model {
        static associate(models) {
            LessonAttendanceSession.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            LessonAttendanceSession.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class_info' });
            LessonAttendanceSession.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
            LessonAttendanceSession.belongsTo(models.Subject, { foreignKey: 'subject_id', as: 'subject' });
            LessonAttendanceSession.belongsTo(models.LessonPeriod, { foreignKey: 'lesson_period_id', as: 'lesson_period' });
            LessonAttendanceSession.hasMany(models.LessonAttendanceDetail, { foreignKey: 'session_id', as: 'details' });
            LessonAttendanceSession.hasMany(models.LessonAttendanceLog, { foreignKey: 'session_id', as: 'logs' });
        }
    }

    LessonAttendanceSession.init({
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        academic_year_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        class_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        subject_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        lesson_period_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        attendance_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        period_number: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        period_start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        period_end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        input_method: {
            type: DataTypes.ENUM('QR', 'ADMIN'),
            allowNull: false,
            defaultValue: 'QR'
        },
        cancelled_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'LessonAttendanceSession',
        tableName: 'lesson_attendance_sessions',
        underscored: true
    });

    return LessonAttendanceSession;
};
