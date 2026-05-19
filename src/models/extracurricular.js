'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Extracurricular extends Model {
        static associate(models) {
            Extracurricular.belongsTo(models.ExtracurricularCategory, { foreignKey: 'category_id', as: 'category' });
            Extracurricular.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            Extracurricular.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            Extracurricular.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });

            Extracurricular.hasMany(models.ExtracurricularCoachAssignment, { foreignKey: 'extracurricular_id', as: 'coach_assignments' });
            Extracurricular.hasMany(models.ExtracurricularSchedule, { foreignKey: 'extracurricular_id', as: 'schedules' });
            Extracurricular.hasMany(models.ExtracurricularRegistration, { foreignKey: 'extracurricular_id', as: 'registrations' });
            Extracurricular.hasMany(models.ExtracurricularMember, { foreignKey: 'extracurricular_id', as: 'members' });
            Extracurricular.hasMany(models.ExtracurricularSession, { foreignKey: 'extracurricular_id', as: 'sessions' });
            Extracurricular.hasMany(models.ExtracurricularProgressAspect, { foreignKey: 'extracurricular_id', as: 'progress_aspects' });
            Extracurricular.hasMany(models.ExtracurricularStudentProgress, { foreignKey: 'extracurricular_id', as: 'student_progress' });
        }
    }

    Extracurricular.init({
        category_id: { type: DataTypes.INTEGER, allowNull: true },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
        code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        type: { type: DataTypes.STRING(30), allowNull: false },
        location: { type: DataTypes.STRING(150), allowNull: true },
        max_members: { type: DataTypes.INTEGER, allowNull: true },
        min_members: { type: DataTypes.INTEGER, allowNull: true },
        registration_start_date: { type: DataTypes.DATEONLY, allowNull: true },
        registration_end_date: { type: DataTypes.DATEONLY, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'Extracurricular',
        tableName: 'extracurriculars',
        underscored: true
    });

    return Extracurricular;
};
