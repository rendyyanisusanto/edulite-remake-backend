'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularMember extends Model {
        static associate(models) {
            ExtracurricularMember.belongsTo(models.Extracurricular, { foreignKey: 'extracurricular_id', as: 'extracurricular' });
            ExtracurricularMember.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            ExtracurricularMember.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            ExtracurricularMember.belongsTo(models.ExtracurricularRegistration, { foreignKey: 'registration_id', as: 'registration' });
            ExtracurricularMember.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            ExtracurricularMember.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
            ExtracurricularMember.hasMany(models.ExtracurricularStudentAttendance, { foreignKey: 'extracurricular_member_id', as: 'attendances' });
            ExtracurricularMember.hasMany(models.ExtracurricularStudentProgress, { foreignKey: 'extracurricular_member_id', as: 'progresses' });
        }
    }

    ExtracurricularMember.init({
        extracurricular_id: { type: DataTypes.INTEGER, allowNull: false },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
        // Deprecated: legacy link to extracurricular_registrations (registration flow is no longer active).
        registration_id: { type: DataTypes.INTEGER, allowNull: true },
        join_date: { type: DataTypes.DATEONLY, allowNull: false },
        exit_date: { type: DataTypes.DATEONLY, allowNull: true },
        member_no: { type: DataTypes.STRING(50), allowNull: true },
        status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE' },
        notes: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularMember',
        tableName: 'extracurricular_members',
        underscored: true
    });

    return ExtracurricularMember;
};
