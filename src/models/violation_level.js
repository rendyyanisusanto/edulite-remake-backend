'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ViolationLevel extends Model {
        static associate(models) {
            ViolationLevel.hasMany(models.ViolationType, { foreignKey: 'level_id', as: 'types' });
        }
    }
    ViolationLevel.init({
        name: {
            type: DataTypes.STRING(50)
        },
        min_point: {
            type: DataTypes.INTEGER
        },
        max_point: {
            type: DataTypes.INTEGER
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'ViolationLevel',
        tableName: 'violation_levels',
        timestamps: false,
        underscored: true,
    });
    return ViolationLevel;
};
