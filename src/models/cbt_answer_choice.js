'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtAnswerChoice extends Model {
        static associate(models) {
            CbtAnswerChoice.belongsTo(models.CbtAnswer, { foreignKey: 'answer_id', as: 'answer' });
            CbtAnswerChoice.belongsTo(models.CbtExamQuestionOption, { foreignKey: 'exam_question_option_id', as: 'examQuestionOption' });
        }
    }
    CbtAnswerChoice.init({
        answer_id: { type: DataTypes.BIGINT, allowNull: false },
        exam_question_option_id: { type: DataTypes.INTEGER, allowNull: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        sequelize,
        modelName: 'CbtAnswerChoice',
        tableName: 'cbt_answer_choices',
        underscored: true,
        timestamps: false
    });
    return CbtAnswerChoice;
};