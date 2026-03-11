'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CounselingCase extends Model {
        static associate(models) {
            CounselingCase.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            CounselingCase.hasMany(models.CounselingSession, { foreignKey: 'case_id', as: 'sessions' });
            CounselingCase.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            CounselingCase.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
        }
    }
    CounselingCase.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        source: {
            type: DataTypes.STRING(30)
        },
        issue_title: {
            type: DataTypes.STRING(150)
        },
        issue_description: {
            type: DataTypes.TEXT
        },
        category: {
            type: DataTypes.STRING(50)
        },
        level: {
            type: DataTypes.STRING(20)
        },
        status: {
            type: DataTypes.STRING(30)
        },
        created_by: {
            type: DataTypes.INTEGER
        },
        updated_by: {
            type: DataTypes.INTEGER
        }
    }, {
        sequelize,
        modelName: 'CounselingCase',
        tableName: 'counseling_cases',
        underscored: true,
    });
    return CounselingCase;
};
