'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ParentDocument extends Model {
        static associate(models) {
            ParentDocument.belongsTo(models.ParentProfile, { foreignKey: 'parent_id', as: 'parent' });
        }
    }

    ParentDocument.init({
        parent_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        document_type: {
            type: DataTypes.STRING(30)
        },
        document_file: {
            type: DataTypes.STRING(255)
        }
    }, {
        sequelize,
        modelName: 'ParentDocument',
        tableName: 'parent_documents',
        underscored: true,
        updatedAt: false
    });

    return ParentDocument;
};
