'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularStudentProgress extends Model {
        static associate(models) {
            ExtracurricularStudentProgress.belongsTo(models.Extracurricular, { foreignKey: 'extracurricular_id', as: 'extracurricular' });
            ExtracurricularStudentProgress.belongsTo(models.ExtracurricularMember, { foreignKey: 'extracurricular_member_id', as: 'member' });
            ExtracurricularStudentProgress.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            ExtracurricularStudentProgress.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            ExtracurricularStudentProgress.belongsTo(models.ExtracurricularSession, { foreignKey: 'session_id', as: 'session' });
            ExtracurricularStudentProgress.belongsTo(models.ExtracurricularProgressAspect, { foreignKey: 'aspect_id', as: 'aspect' });
            ExtracurricularStudentProgress.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            ExtracurricularStudentProgress.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
        }
    }

    ExtracurricularStudentProgress.init({
        extracurricular_id: { type: DataTypes.INTEGER, allowNull: false },
        extracurricular_member_id: { type: DataTypes.INTEGER, allowNull: false },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
        session_id: { type: DataTypes.INTEGER, allowNull: true },
        aspect_id: { type: DataTypes.INTEGER, allowNull: true },
        progress_date: { type: DataTypes.DATEONLY, allowNull: false },
        score: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        predicate: { type: DataTypes.STRING(30), allowNull: true },
        level: { type: DataTypes.STRING(30), allowNull: true },
        note: { type: DataTypes.TEXT, allowNull: true },
        recommendation: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularStudentProgress',
        tableName: 'extracurricular_student_progress',
        underscored: true
    });

    return ExtracurricularStudentProgress;
};
