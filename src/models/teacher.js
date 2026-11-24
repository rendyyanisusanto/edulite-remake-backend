'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Teacher extends Model {
        static associate(models) {
            Teacher.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            Teacher.hasMany(models.ExtracurricularCoach, { foreignKey: 'teacher_id', as: 'extracurricular_coach_profiles' });
            Teacher.hasMany(models.LessonAttendanceSession, { foreignKey: 'teacher_id', as: 'lesson_attendance_sessions' });
            Teacher.hasMany(models.LessonAttendanceLog, { foreignKey: 'teacher_id', as: 'lesson_attendance_logs' });
        }
    }
    Teacher.init({
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        full_name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        nip: {
            type: DataTypes.STRING(50)
        },
        position: {
            type: DataTypes.STRING(100)
        },
        gender: {
            type: DataTypes.ENUM('L', 'P'),
            defaultValue: 'L'
        },
        phone: {
            type: DataTypes.STRING(20)
        },
        photo: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        attendance_pin_hash: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        }
    }, {
        sequelize,
        modelName: 'Teacher',
        tableName: 'teachers',
        underscored: true,
        defaultScope: {
            attributes: { exclude: ['attendance_pin_hash'] }
        },
        scopes: {
            withPinHash: {
                attributes: {}
            }
        }
    });
    return Teacher;
};
