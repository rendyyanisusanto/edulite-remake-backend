'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Student extends Model {
        static associate(models) {
            Student.hasMany(models.ParentProfile, { foreignKey: 'student_id', as: 'parents' });
            Student.hasMany(models.StudentDocument, { foreignKey: 'student_id', as: 'documents' });
            Student.hasMany(models.StudentClassHistory, { foreignKey: 'student_id', as: 'class_history' });
            Student.hasMany(models.StudentViolation, { foreignKey: 'student_id', as: 'violations' });
            Student.hasMany(models.CounselingCase, { foreignKey: 'student_id', as: 'counseling_cases' });
        }
    }
    Student.init({
        nis: {
            type: DataTypes.STRING(50)
        },
        nisn: {
            type: DataTypes.STRING(50)
        },
        full_name: {
            type: DataTypes.STRING(100)
        },
        gender: {
            type: DataTypes.STRING(10)
        },
        date_of_birth: {
            type: DataTypes.DATEONLY
        },
        address: {
            type: DataTypes.TEXT
        },
        rfid_code: {
            type: DataTypes.STRING(100)
        },
        qr_code: {
            type: DataTypes.STRING(255)
        },
        barcode: {
            type: DataTypes.STRING(100)
        },
        card_template_id: {
            type: DataTypes.INTEGER
        },
        card_number: {
            type: DataTypes.STRING(100)
        },
        photo: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'Student',
        tableName: 'students',
        underscored: true,
    });
    return Student;
};
