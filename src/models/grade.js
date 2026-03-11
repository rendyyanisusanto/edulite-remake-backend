'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Grade extends Model {
        static associate(models) {
            Grade.hasMany(models.Class, { foreignKey: 'grade_id', as: 'classes' });
        }
    }
    Grade.init({
        name: {
            type: DataTypes.STRING(50)
        },
        level: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'Grade',
        tableName: 'grades',
        underscored: true,
    });
    return Grade;
};
