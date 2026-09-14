'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtAttempt extends Model {
        static associate(models) {
            CbtAttempt.belongsTo(models.CbtExamParticipant, { foreignKey: 'participant_id', as: 'participant' });
            CbtAttempt.hasMany(models.CbtAnswer, { foreignKey: 'attempt_id', as: 'answers' });
            CbtAttempt.hasMany(models.CbtActivityLog, { foreignKey: 'attempt_id', as: 'activityLogs' });
        }
    }
    CbtAttempt.init({
        participant_id: { type: DataTypes.INTEGER, allowNull: false },
        attempt_number: { type: DataTypes.INTEGER, defaultValue: 1 },
        randomization_seed: { type: DataTypes.STRING(100), allowNull: false },
        session_token_hash: { type: DataTypes.STRING(255) },
        started_at: { type: DataTypes.DATE, allowNull: false },
        expires_at: { type: DataTypes.DATE, allowNull: false },
        submitted_at: { type: DataTypes.DATE },
        last_activity_at: { type: DataTypes.DATE },
        status: { type: DataTypes.STRING(20), defaultValue: 'IN_PROGRESS' },
        objective_points: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
        essay_points: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
        earned_points: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
        maximum_points: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
        final_score: { type: DataTypes.DECIMAL(5, 2) },
        correct_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        wrong_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        unanswered_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        ip_address: { type: DataTypes.STRING(45) },
        user_agent: { type: DataTypes.STRING(500) },
        version: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        sequelize,
        modelName: 'CbtAttempt',
        tableName: 'cbt_attempts',
        underscored: true,
        timestamps: true
    });
    return CbtAttempt;
};