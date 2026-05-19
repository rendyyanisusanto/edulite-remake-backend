'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularCoachAssignment extends Model {
        static associate(models) {
            ExtracurricularCoachAssignment.belongsTo(models.Extracurricular, { foreignKey: 'extracurricular_id', as: 'extracurricular' });
            ExtracurricularCoachAssignment.belongsTo(models.ExtracurricularCoach, { foreignKey: 'coach_id', as: 'coach' });
            ExtracurricularCoachAssignment.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            ExtracurricularCoachAssignment.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
            ExtracurricularCoachAssignment.hasMany(models.ExtracurricularSession, { foreignKey: 'coach_assignment_id', as: 'sessions' });
        }
    }

    ExtracurricularCoachAssignment.init({
        extracurricular_id: { type: DataTypes.INTEGER, allowNull: false },
        coach_id: { type: DataTypes.INTEGER, allowNull: false },
        role: { type: DataTypes.STRING(30), allowNull: false },
        start_date: { type: DataTypes.DATEONLY, allowNull: true },
        end_date: { type: DataTypes.DATEONLY, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularCoachAssignment',
        tableName: 'extracurricular_coach_assignments',
        underscored: true
    });

    return ExtracurricularCoachAssignment;
};
