'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Achievement extends Model {
        static associate(models) {
            Achievement.hasMany(models.AchievementParticipant, { foreignKey: 'achievement_id', as: 'participants' });
            Achievement.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            Achievement.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            Achievement.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
        }
    }
    Achievement.init({
        title: {
            type: DataTypes.STRING(150)
        },
        level: {
            type: DataTypes.STRING(50)
        },
        organizer: {
            type: DataTypes.STRING(150)
        },
        academic_year_id: {
            type: DataTypes.INTEGER
        },
        location: {
            type: DataTypes.STRING(150)
        },
        event_type: {
            type: DataTypes.STRING(50)
        },
        event_date: {
            type: DataTypes.DATEONLY
        },
        description: {
            type: DataTypes.TEXT
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        updated_by: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'Achievement',
        tableName: 'achievements',
        underscored: true,
    });
    return Achievement;
};
