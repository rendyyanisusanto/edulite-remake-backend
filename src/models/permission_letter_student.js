'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class PermissionLetterStudent extends Model {
        static associate(models) {
            PermissionLetterStudent.belongsTo(models.PermissionLetter, {
                foreignKey: 'permission_letter_id',
                as: 'permission_letter'
            });
            PermissionLetterStudent.belongsTo(models.Student, {
                foreignKey: 'student_id',
                as: 'student'
            });
        }
    }

    PermissionLetterStudent.init({
        permission_letter_id: {
            type: DataTypes.INTEGER
        },
        student_id: {
            type: DataTypes.INTEGER
        },
        notes: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'PermissionLetterStudent',
        tableName: 'permission_letter_students',
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false
    });

    return PermissionLetterStudent;
};
