'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtExamQuestionOption extends Model {
        static associate(models) {
            CbtExamQuestionOption.belongsTo(models.CbtExamQuestion, { foreignKey: 'exam_question_id', as: 'examQuestion' });
        }
    }
    CbtExamQuestionOption.init({
        exam_question_id: { type: DataTypes.INTEGER, allowNull: false },
        source_option_id: { type: DataTypes.INTEGER },
        option_key: { type: DataTypes.STRING(10), allowNull: false },
        option_text: { type: DataTypes.TEXT('long'), allowNull: false },
        media_url: { type: DataTypes.STRING(500) },
        is_correct: { type: DataTypes.BOOLEAN, defaultValue: false },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        sequelize,
        modelName: 'CbtExamQuestionOption',
        tableName: 'cbt_exam_question_options',
        underscored: true,
        timestamps: true
    });
    return CbtExamQuestionOption;
};