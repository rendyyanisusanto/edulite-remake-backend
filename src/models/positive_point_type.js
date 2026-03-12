'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class PositivePointType extends Model {
        static associate(models) {
            PositivePointType.hasMany(models.StudentPositivePoint, { foreignKey: 'type_id', as: 'student_positive_points' });
        }
    }
    PositivePointType.init({
        name: {
            type: DataTypes.STRING(100)
        },
        category: {
            type: DataTypes.STRING(50)
        },
        points: {
            type: DataTypes.INTEGER
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'PositivePointType',
        tableName: 'positive_point_types',
        updatedAt: false,
        underscored: true,
    });
    return PositivePointType;
};
