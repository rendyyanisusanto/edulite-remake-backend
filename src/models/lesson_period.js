'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class LessonPeriod extends Model {
        static associate(models) {
            LessonPeriod.belongsTo(models.LessonPeriodTemplate, { foreignKey: 'template_id', as: 'template' });
        }
    }
    LessonPeriod.init({
        template_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        period_order: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        period_number: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        period_type: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        is_attendance_enabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
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
        modelName: 'LessonPeriod',
        tableName: 'lesson_periods',
        underscored: true
    });
    return LessonPeriod;
};

