'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentDocument extends Model {
        static associate(models) {
            StudentDocument.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentDocument.belongsTo(models.DocumentType, { foreignKey: 'document_type_id', as: 'document_type' });
            StudentDocument.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            StudentDocument.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
        }
    }
    StudentDocument.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        document_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        document_number: {
            type: DataTypes.STRING(100)
        },
        issued_date: {
            type: DataTypes.DATEONLY
        },
        document_file: {
            type: DataTypes.STRING(255)
        },
        notes: {
            type: DataTypes.TEXT
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        updated_by: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'StudentDocument',
        tableName: 'student_documents',
        underscored: true,
    });
    return StudentDocument;
};
