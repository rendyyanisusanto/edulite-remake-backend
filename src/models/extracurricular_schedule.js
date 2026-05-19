'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularSchedule extends Model {
        static associate(models) {
            ExtracurricularSchedule.belongsTo(models.Extracurricular, { foreignKey: 'extracurricular_id', as: 'extracurricular' });
            ExtracurricularSchedule.hasMany(models.ExtracurricularSession, { foreignKey: 'schedule_id', as: 'sessions' });
        }
    }

    ExtracurricularSchedule.init({
        extracurricular_id: { type: DataTypes.INTEGER, allowNull: false },
        title: { type: DataTypes.STRING(150), allowNull: true },
        day_of_week: { type: DataTypes.STRING(20), allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: false },
        end_time: { type: DataTypes.TIME, allowNull: false },
        location: { type: DataTypes.STRING(150), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularSchedule',
        tableName: 'extracurricular_schedules',
        underscored: true
    });

    return ExtracurricularSchedule;
};
