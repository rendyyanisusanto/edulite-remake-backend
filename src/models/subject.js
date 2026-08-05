'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Subject extends Model {
        static associate(models) {
            Subject.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
        }
    }
    Subject.init({
        code: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        subject_type: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        department_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Subject',
        tableName: 'subjects',
        underscored: true
    });
    return Subject;
};

