'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtExamQuestion extends Model {
        static associate(models) {
            CbtExamQuestion.belongsTo(models.CbtExam, { foreignKey: 'exam_id', as: 'exam' });
            CbtExamQuestion.belongsTo(models.CbtQuestion, { foreignKey: 'source_question_id', as: 'sourceQuestion' });
            CbtExamQuestion.hasMany(models.CbtExamQuestionOption, { foreignKey: 'exam_question_id', as: 'options' });
        }
    }
    CbtExamQuestion.init({
        exam_id: { type: DataTypes.INTEGER, allowNull: false },
        source_question_id: { type: DataTypes.INTEGER },
        question_type: { type: DataTypes.STRING(30), allowNull: false },
        question_text: { type: DataTypes.TEXT('long'), allowNull: false },
        media_url: { type: DataTypes.STRING(500) },
        answer_key: { type: DataTypes.JSON },
        explanation: { type: DataTypes.TEXT('long') },
        score: { type: DataTypes.DECIMAL(8, 2), defaultValue: 1.00 },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        sequelize,
        modelName: 'CbtExamQuestion',
        tableName: 'cbt_exam_questions',
        underscored: true,
        timestamps: true
    });
    return CbtExamQuestion;
};