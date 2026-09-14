'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtQuestion extends Model {
        static associate(models) {
            CbtQuestion.belongsTo(models.CbtQuestionBank, { foreignKey: 'question_bank_id', as: 'questionBank' });
            CbtQuestion.hasMany(models.CbtQuestionOption, { foreignKey: 'question_id', as: 'options' });
        }
    }
    CbtQuestion.init({
        question_bank_id: { type: DataTypes.INTEGER, allowNull: false },
        question_type: { type: DataTypes.STRING(30), allowNull: false },
        question_text: { type: DataTypes.TEXT('long'), allowNull: false },
        media_url: { type: DataTypes.STRING(500) },
        difficulty: { type: DataTypes.STRING(20), defaultValue: 'MEDIUM' },
        default_score: { type: DataTypes.DECIMAL(8, 2), defaultValue: 1.00 },
        answer_key: { type: DataTypes.JSON },
        explanation: { type: DataTypes.TEXT('long') },
        status: { type: DataTypes.STRING(20), defaultValue: 'DRAFT' },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER },
        deleted_at: { type: DataTypes.DATE }
    }, {
        sequelize,
        modelName: 'CbtQuestion',
        tableName: 'cbt_questions',
        underscored: true,
        timestamps: true,
        paranoid: true
    });
    return CbtQuestion;
};