'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AchievementParticipant extends Model {
        static associate(models) {
            AchievementParticipant.belongsTo(models.Achievement, { foreignKey: 'achievement_id', as: 'achievement' });
            AchievementParticipant.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            AchievementParticipant.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
            AchievementParticipant.hasOne(models.AchievementResult, { foreignKey: 'participant_id', as: 'result' });
        }
    }
    AchievementParticipant.init({
        achievement_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        student_id: {
            type: DataTypes.INTEGER
        },
        teacher_id: {
            type: DataTypes.INTEGER
        },
        role: {
            type: DataTypes.STRING(50)
        },
        notes: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'AchievementParticipant',
        tableName: 'achievement_participants',
        timestamps: false,
        underscored: true,
    });
    return AchievementParticipant;
};
