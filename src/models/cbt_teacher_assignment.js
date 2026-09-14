'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtTeacherAssignment extends Model {
        static associate(models) {
            CbtTeacherAssignment.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
            CbtTeacherAssignment.belongsTo(models.Subject, { foreignKey: 'subject_id' });
            CbtTeacherAssignment.belongsTo(models.Class, { foreignKey: 'class_id' });
            CbtTeacherAssignment.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id' });
            CbtTeacherAssignment.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
        }
    }
    CbtTeacherAssignment.init({
        teacher_id: { type: DataTypes.INTEGER, allowNull: false },
        subject_id: { type: DataTypes.INTEGER, allowNull: false },
        class_id: { type: DataTypes.INTEGER, allowNull: false },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
        semester: { type: DataTypes.STRING(20), allowNull: false },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        created_by: { type: DataTypes.INTEGER }
    }, {
        sequelize,
        modelName: 'CbtTeacherAssignment',
        tableName: 'cbt_teacher_assignments',
        underscored: true,
        timestamps: true
    });
    return CbtTeacherAssignment;
};