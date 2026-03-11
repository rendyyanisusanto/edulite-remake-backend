'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Department extends Model {
        static associate(models) {
            Department.hasMany(models.Class, { foreignKey: 'department_id', as: 'classes' });
        }
    }
    Department.init({
        name: {
            type: DataTypes.STRING(100)
        },
        code: {
            type: DataTypes.STRING(20)
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'Department',
        tableName: 'departments',
        underscored: true,
    });
    return Department;
};
