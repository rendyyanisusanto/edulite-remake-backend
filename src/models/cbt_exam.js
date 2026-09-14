'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtExam extends Model {
        static associate(models) {
            CbtExam.belongsTo(models.Subject, { foreignKey: 'subject_id' });
            CbtExam.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id' });
            CbtExam.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            CbtExam.hasMany(models.CbtExamQuestion, { foreignKey: 'exam_id', as: 'examQuestions' });
            CbtExam.hasMany(models.CbtExamSchedule, { foreignKey: 'exam_id', as: 'schedules' });
        }
    }
    CbtExam.init({
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        title: { type: DataTypes.STRING(200), allowNull: false },
        subject_id: { type: DataTypes.INTEGER, allowNull: false },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
        semester: { type: DataTypes.STRING(20), allowNull: false },
        exam_type: { type: DataTypes.STRING(30), allowNull: false },
        description: { type: DataTypes.TEXT },
        instructions: { type: DataTypes.TEXT('long') },
        duration_minutes: { type: DataTypes.INTEGER, allowNull: false },
        passing_score: { type: DataTypes.DECIMAL(5, 2) },
        shuffle_questions: { type: DataTypes.BOOLEAN, defaultValue: true },
        shuffle_options: { type: DataTypes.BOOLEAN, defaultValue: true },
        max_attempts: { type: DataTypes.INTEGER, defaultValue: 1 },
        result_visibility: { type: DataTypes.STRING(30), defaultValue: 'HIDDEN' },
        result_published_at: { type: DataTypes.DATE },
        status: { type: DataTypes.STRING(20), defaultValue: 'DRAFT' },
        published_at: { type: DataTypes.DATE },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER },
        deleted_at: { type: DataTypes.DATE }
    }, {
        sequelize,
        modelName: 'CbtExam',
        tableName: 'cbt_exams',
        underscored: true,
        timestamps: true,
        paranoid: true
    });
    return CbtExam;
};