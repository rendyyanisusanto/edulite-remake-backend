'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentClassHistory extends Model {
        static associate(models) {
            StudentClassHistory.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentClassHistory.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentClassHistory.belongsTo(models.Grade, { foreignKey: 'grade_id', as: 'grade' });
            StudentClassHistory.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class_info' });
            StudentClassHistory.belongsTo(models.User, { foreignKey: 'assigned_by', as: 'assigner' });
        }
    }
    StudentClassHistory.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        academic_year_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        grade_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        class_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        assigned_by: {
            type: DataTypes.INTEGER
        },
        assignment_type: {
            type: DataTypes.STRING(20) // AUTO / MANUAL
        }
    }, {
        sequelize,
        modelName: 'StudentClassHistory',
        tableName: 'student_class_history',
        updatedAt: false,
        underscored: true,
    });
    return StudentClassHistory;
};
