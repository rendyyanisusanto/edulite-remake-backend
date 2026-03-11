'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ViolationType extends Model {
        static associate(models) {
            ViolationType.belongsTo(models.ViolationLevel, { foreignKey: 'level_id', as: 'level' });
            ViolationType.hasMany(models.StudentViolation, { foreignKey: 'type_id', as: 'student_violations' });
        }
    }
    ViolationType.init({
        level_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(100)
        },
        point: {
            type: DataTypes.INTEGER
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'ViolationType',
        tableName: 'violation_types',
        timestamps: false,
        underscored: true,
    });
    return ViolationType;
};
