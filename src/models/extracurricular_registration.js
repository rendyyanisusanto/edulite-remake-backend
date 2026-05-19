'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularRegistration extends Model {
        static associate(models) {
            ExtracurricularRegistration.belongsTo(models.Extracurricular, { foreignKey: 'extracurricular_id', as: 'extracurricular' });
            ExtracurricularRegistration.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            ExtracurricularRegistration.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            ExtracurricularRegistration.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
            ExtracurricularRegistration.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            ExtracurricularRegistration.hasOne(models.ExtracurricularMember, { foreignKey: 'registration_id', as: 'member' });
        }
    }

    ExtracurricularRegistration.init({
        extracurricular_id: { type: DataTypes.INTEGER, allowNull: false },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
        registration_date: { type: DataTypes.DATE, allowNull: false },
        status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'PENDING' },
        source: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'MOBILE' },
        notes: { type: DataTypes.TEXT, allowNull: true },
        approved_at: { type: DataTypes.DATE, allowNull: true },
        approved_by: { type: DataTypes.INTEGER, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularRegistration',
        tableName: 'extracurricular_registrations',
        updatedAt: false,
        underscored: true
    });

    return ExtracurricularRegistration;
};
