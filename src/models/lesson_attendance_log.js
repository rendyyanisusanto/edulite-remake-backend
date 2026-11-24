'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LessonAttendanceLog extends Model {
        static associate(models) {
            LessonAttendanceLog.belongsTo(models.LessonAttendanceSession, { foreignKey: 'session_id', as: 'session' });
            LessonAttendanceLog.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
            LessonAttendanceLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
        }
    }

    LessonAttendanceLog.init({
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        session_id: {
            type: DataTypes.BIGINT,
            allowNull: true
        },
        teacher_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        action: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        old_data: {
            type: DataTypes.JSON,
            allowNull: true
        },
        new_data: {
            type: DataTypes.JSON,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.STRING(45),
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'LessonAttendanceLog',
        tableName: 'lesson_attendance_logs',
        updatedAt: false,
        underscored: true
    });

    return LessonAttendanceLog;
};
