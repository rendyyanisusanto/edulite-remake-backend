'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AchievementPointRule extends Model {
        static associate(models) {
            AchievementPointRule.hasMany(models.AchievementResult, { foreignKey: 'point_rule_id', as: 'results' });
        }
    }
    AchievementPointRule.init({
        level: {
            type: DataTypes.STRING(50)
        },
        rank: {
            type: DataTypes.STRING(50)
        },
        category: {
            type: DataTypes.STRING(100)
        },
        points: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        description: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'AchievementPointRule',
        tableName: 'achievement_point_rules',
        timestamps: true,
        updatedAt: false,
        underscored: true,
    });
    return AchievementPointRule;
};
