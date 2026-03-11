'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Teacher extends Model {
        static associate(models) {
            Teacher.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
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
        }
    }, {
        sequelize,
        modelName: 'Teacher',
        tableName: 'teachers',
        underscored: true,
    });
    return Teacher;
};
