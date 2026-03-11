'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Class extends Model {
        static associate(models) {
            Class.belongsTo(models.Grade, { foreignKey: 'grade_id', as: 'grade' });
            Class.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            Class.belongsTo(models.Teacher, { foreignKey: 'homeroom_teacher_id', as: 'homeroom_teacher' });
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
        }
    }, {
        sequelize,
        modelName: 'Class',
        tableName: 'classes',
        underscored: true,
    });
    return Class;
};
