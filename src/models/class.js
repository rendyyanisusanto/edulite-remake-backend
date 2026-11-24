'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Class extends Model {
        static associate(models) {
            Class.belongsTo(models.Grade, { foreignKey: 'grade_id', as: 'grade' });
            Class.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            Class.belongsTo(models.Teacher, { foreignKey: 'homeroom_teacher_id', as: 'homeroom_teacher' });
            Class.hasMany(models.StudentAttendanceShiftClass, { foreignKey: 'class_id', as: 'student_attendance_shift_mappings' });
            Class.hasMany(models.StudentDailyAttendance, { foreignKey: 'class_id', as: 'student_daily_attendances' });
            Class.hasMany(models.StudentToiletPermission, { foreignKey: 'class_id', as: 'student_toilet_permissions' });
            Class.hasMany(models.LessonAttendanceSession, { foreignKey: 'class_id', as: 'lesson_attendance_sessions' });
        }
    }
    Class.init({
        grade_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        department_id: {
            type: DataTypes.INTEGER
        },
        name: {
            type: DataTypes.STRING(50)
        },
        homeroom_teacher_id: {
            type: DataTypes.INTEGER
        },
        capacity: {
            type: DataTypes.INTEGER
        },
        attendance_token: {
            type: DataTypes.STRING(255),
            allowNull: true,
            unique: true,
            defaultValue: null
        },
        attendance_qr_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    }, {
        sequelize,
        modelName: 'Class',
        tableName: 'classes',
        underscored: true,
        defaultScope: {
            attributes: { exclude: ['attendance_token'] }
        },
        scopes: {
            withAttendanceToken: {
                attributes: {}
            }
        }
    });
    return Class;
};
