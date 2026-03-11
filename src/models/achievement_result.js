'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AchievementResult extends Model {
        static associate(models) {
            AchievementResult.belongsTo(models.AchievementParticipant, { foreignKey: 'participant_id', as: 'participant' });
            AchievementResult.belongsTo(models.AchievementPointRule, { foreignKey: 'point_rule_id', as: 'point_rule' });
        }
    }
    AchievementResult.init({
        participant_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        rank: {
            type: DataTypes.STRING(50)
        },
        score: {
            type: DataTypes.STRING(50)
        },
        category: {
            type: DataTypes.STRING(100)
        },
        point_rule_id: {
            type: DataTypes.INTEGER
        },
        points: {
            type: DataTypes.INTEGER
        },
        certificate_file: {
            type: DataTypes.STRING(255)
        },
        notes: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'AchievementResult',
        tableName: 'achievement_results',
        timestamps: false,
        underscored: true,
    });
    return AchievementResult;
};
