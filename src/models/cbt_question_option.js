'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtQuestionOption extends Model {
        static associate(models) {
            CbtQuestionOption.belongsTo(models.CbtQuestion, { foreignKey: 'question_id', as: 'question' });
        }
    }
    CbtQuestionOption.init({
        question_id: { type: DataTypes.INTEGER, allowNull: false },
        option_key: { type: DataTypes.STRING(10), allowNull: false },
        option_text: { type: DataTypes.TEXT('long'), allowNull: false },
        media_url: { type: DataTypes.STRING(500) },
        is_correct: { type: DataTypes.BOOLEAN, defaultValue: false },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        sequelize,
        modelName: 'CbtQuestionOption',
        tableName: 'cbt_question_options',
        underscored: true,
        timestamps: true
    });
    return CbtQuestionOption;
};