'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentViolation extends Model {
        static associate(models) {
            StudentViolation.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentViolation.belongsTo(models.ViolationType, { foreignKey: 'type_id', as: 'type' });
            StudentViolation.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            StudentViolation.belongsTo(models.User, { foreignKey: 'approved_by', as: 'approver' });
        }
    }
    StudentViolation.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        type_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY
        },
        location: {
            type: DataTypes.STRING(100)
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
        modelName: 'StudentViolation',
        tableName: 'student_violations',
        updatedAt: false,
        underscored: true,
    });
    return StudentViolation;
};
