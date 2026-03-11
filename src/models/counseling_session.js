'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CounselingSession extends Model {
        static associate(models) {
            CounselingSession.belongsTo(models.CounselingCase, { foreignKey: 'case_id', as: 'counseling_case' });
            CounselingSession.belongsTo(models.User, { foreignKey: 'counselor_id', as: 'counselor' });
        }
    }
    CounselingSession.init({
        case_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        counselor_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        session_date: {
            type: DataTypes.DATE
        },
        method: {
            type: DataTypes.STRING(30)
        },
        duration: {
            type: DataTypes.INTEGER
        },
        notes: {
            type: DataTypes.TEXT
        },
        next_plan: {
            type: DataTypes.TEXT
        }
    }, {
        sequelize,
        modelName: 'CounselingSession',
        tableName: 'counseling_sessions',
        updatedAt: false,
        underscored: true,
    });
    return CounselingSession;
};
