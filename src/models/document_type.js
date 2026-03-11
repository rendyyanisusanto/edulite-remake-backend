'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class DocumentType extends Model {
        static associate(models) {
            DocumentType.hasMany(models.StudentDocument, { foreignKey: 'document_type_id', as: 'documents' });
        }
    }
    DocumentType.init({
        code: {
            type: DataTypes.STRING(50)
        },
        name: {
            type: DataTypes.STRING(100)
        },
        required: {
            type: DataTypes.BOOLEAN
        },
        description: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'DocumentType',
        tableName: 'document_types',
        underscored: true,
    });
    return DocumentType;
};
