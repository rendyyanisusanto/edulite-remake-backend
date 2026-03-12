'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentPositivePoint extends Model {
        static associate(models) {
            StudentPositivePoint.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentPositivePoint.belongsTo(models.PositivePointType, { foreignKey: 'type_id', as: 'type' });
            StudentPositivePoint.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentPositivePoint.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            StudentPositivePoint.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
        }
    }
    StudentPositivePoint.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        academic_year_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY
        },
        location: {
            type: DataTypes.STRING(100)
        },
        points: {
            type: DataTypes.INTEGER
        },
        description: {
            type: DataTypes.TEXT
        },
        evidence_file: {
            type: DataTypes.STRING(255)
        },
        status: {
            type: DataTypes.STRING(30)
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        approved_by: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'StudentPositivePoint',
        tableName: 'student_positive_points',
        updatedAt: false,
        underscored: true,
    });
    return StudentPositivePoint;
};
