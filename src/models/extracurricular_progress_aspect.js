'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularProgressAspect extends Model {
        static associate(models) {
            ExtracurricularProgressAspect.belongsTo(models.Extracurricular, { foreignKey: 'extracurricular_id', as: 'extracurricular' });
            ExtracurricularProgressAspect.hasMany(models.ExtracurricularStudentProgress, { foreignKey: 'aspect_id', as: 'progresses' });
        }
    }

    ExtracurricularProgressAspect.init({
        extracurricular_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularProgressAspect',
        tableName: 'extracurricular_progress_aspects',
        underscored: true
    });

    return ExtracurricularProgressAspect;
};
