'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentItemCategory extends Model {
        static associate(models) {
            StudentItemCategory.hasMany(models.StudentItemDeposit, { foreignKey: 'category_id', as: 'deposits' });
        }
    }

    StudentItemCategory.init({
        name: { type: DataTypes.STRING(100), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    }, {
        sequelize,
        modelName: 'StudentItemCategory',
        tableName: 'student_item_categories',
        underscored: true
    });

    return StudentItemCategory;
};
