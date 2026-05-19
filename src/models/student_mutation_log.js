'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentMutationLog extends Model {
        static associate(models) {
            StudentMutationLog.belongsTo(models.StudentMutation, { foreignKey: 'mutation_id', as: 'mutation' });
            StudentMutationLog.belongsTo(models.User, { foreignKey: 'action_by', as: 'actor' });
        }
    }

    StudentMutationLog.init({
        mutation_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        action: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        action_note: {
            type: DataTypes.TEXT
        },
        action_by: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'StudentMutationLog',
        tableName: 'student_mutation_logs',
        updatedAt: false,
        underscored: true
    });

    return StudentMutationLog;
};
