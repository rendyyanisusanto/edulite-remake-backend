'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Teacher extends Model {
        static associate(models) {
            Teacher.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            Teacher.hasMany(models.ExtracurricularCoach, { foreignKey: 'teacher_id', as: 'extracurricular_coach_profiles' });
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
        }
    }, {
        sequelize,
        modelName: 'Teacher',
        tableName: 'teachers',
        underscored: true,
    });
    return Teacher;
};
