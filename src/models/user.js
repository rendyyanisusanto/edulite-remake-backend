'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.belongsToMany(models.Role, {
                through: models.UserRole,
                foreignKey: 'user_id',
                otherKey: 'role_id',
                as: 'roles'
            });
            User.hasMany(models.Session, { foreignKey: 'user_id', as: 'sessions' });
            User.hasOne(models.Teacher, { foreignKey: 'user_id', as: 'teacher_profile' });
            User.hasMany(models.UserAttendance, { foreignKey: 'user_id', as: 'attendances' });
            User.hasMany(models.AttendanceRequest, { foreignKey: 'user_id', as: 'attendance_requests' });
            User.hasOne(models.ExtracurricularCoach, { foreignKey: 'user_id', as: 'extracurricular_coach_profile' });
            User.hasMany(models.StudentMutation, { foreignKey: 'created_by', as: 'created_student_mutations' });
            User.hasMany(models.StudentMutation, { foreignKey: 'updated_by', as: 'updated_student_mutations' });
            User.hasMany(models.StudentMutation, { foreignKey: 'approved_by', as: 'approved_student_mutations' });
            User.hasMany(models.StudentMutationLog, { foreignKey: 'action_by', as: 'student_mutation_logs' });
        }
    }
    User.init({
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        last_login: {
            type: DataTypes.DATE
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        underscored: true,
    });
    return User;
};
