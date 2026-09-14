'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtQuestionBank extends Model {
        static associate(models) {
            CbtQuestionBank.belongsTo(models.Subject, { foreignKey: 'subject_id' });
            CbtQuestionBank.belongsTo(models.Grade, { foreignKey: 'grade_id' });
            CbtQuestionBank.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id' });
            CbtQuestionBank.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            CbtQuestionBank.hasMany(models.CbtQuestion, { foreignKey: 'question_bank_id', as: 'questions' });
        }
    }
    CbtQuestionBank.init({
        name: { type: DataTypes.STRING(150), allowNull: false },
        subject_id: { type: DataTypes.INTEGER, allowNull: false },
        grade_id: { type: DataTypes.INTEGER },
        academic_year_id: { type: DataTypes.INTEGER },
        semester: { type: DataTypes.STRING(20) },
        description: { type: DataTypes.TEXT },
        status: { type: DataTypes.STRING(20), defaultValue: 'ACTIVE' },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER },
        deleted_at: { type: DataTypes.DATE }
    }, {
        sequelize,
        modelName: 'CbtQuestionBank',
        tableName: 'cbt_question_banks',
        underscored: true,
        timestamps: true,
        paranoid: true
    });
    return CbtQuestionBank;
};