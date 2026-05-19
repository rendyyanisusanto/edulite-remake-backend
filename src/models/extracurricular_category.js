'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularCategory extends Model {
        static associate(models) {
            ExtracurricularCategory.hasMany(models.Extracurricular, { foreignKey: 'category_id', as: 'extracurriculars' });
        }
    }

    ExtracurricularCategory.init({
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularCategory',
        tableName: 'extracurricular_categories',
        underscored: true
    });

    return ExtracurricularCategory;
};
