'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtAnswer extends Model {
        static associate(models) {
            CbtAnswer.belongsTo(models.CbtAttempt, { foreignKey: 'attempt_id', as: 'attempt' });
            CbtAnswer.belongsTo(models.CbtExamQuestion, { foreignKey: 'exam_question_id', as: 'examQuestion' });
            CbtAnswer.hasMany(models.CbtAnswerChoice, { foreignKey: 'answer_id', as: 'choices' });
        }
    }
    CbtAnswer.init({
        attempt_id: { type: DataTypes.BIGINT, allowNull: false },
        exam_question_id: { type: DataTypes.INTEGER, allowNull: false },
        answer_text: { type: DataTypes.TEXT('long') },
        is_flagged: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_correct: { type: DataTypes.BOOLEAN },
        score_awarded: { type: DataTypes.DECIMAL(8, 2) },
        grading_status: { type: DataTypes.STRING(20), defaultValue: 'PENDING' },
        teacher_feedback: { type: DataTypes.TEXT },
        reviewed_by: { type: DataTypes.INTEGER },
        reviewed_at: { type: DataTypes.DATE },
        answered_at: { type: DataTypes.DATE },
        version: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        sequelize,
        modelName: 'CbtAnswer',
        tableName: 'cbt_answers',
        underscored: true,
        timestamps: true
    });
    return CbtAnswer;
};