'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LessonPeriodTemplate extends Model {
        static associate(models) {
            LessonPeriodTemplate.hasMany(models.LessonPeriod, { foreignKey: 'template_id', as: 'periods' });
        }
    }
    LessonPeriodTemplate.init({
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        is_default: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'LessonPeriodTemplate',
        tableName: 'lesson_period_templates',
        underscored: true
    });
    return LessonPeriodTemplate;
};

