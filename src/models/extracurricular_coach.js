'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularCoach extends Model {
        static associate(models) {
            ExtracurricularCoach.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            ExtracurricularCoach.belongsTo(models.Teacher, { foreignKey: 'teacher_id', as: 'teacher' });
            ExtracurricularCoach.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            ExtracurricularCoach.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
            ExtracurricularCoach.hasMany(models.ExtracurricularCoachAssignment, { foreignKey: 'coach_id', as: 'assignments' });
        }
    }

    ExtracurricularCoach.init({
        user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        teacher_id: { type: DataTypes.INTEGER, allowNull: true },
        coach_type: { type: DataTypes.STRING(30), allowNull: false },
        full_name: { type: DataTypes.STRING(100), allowNull: false },
        gender: { type: DataTypes.STRING(20), allowNull: true },
        phone: { type: DataTypes.STRING(30), allowNull: true },
        email: { type: DataTypes.STRING(100), allowNull: true },
        address: { type: DataTypes.TEXT, allowNull: true },
        expertise: { type: DataTypes.STRING(150), allowNull: true },
        photo: { type: DataTypes.STRING(255), allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        created_by: { type: DataTypes.INTEGER, allowNull: true },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularCoach',
        tableName: 'extracurricular_coaches',
        underscored: true
    });

    return ExtracurricularCoach;
};
