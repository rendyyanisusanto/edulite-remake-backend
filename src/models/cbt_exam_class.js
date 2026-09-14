'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtExamClass extends Model {
        static associate(models) {
            CbtExamClass.belongsTo(models.CbtExamSchedule, { foreignKey: 'schedule_id', as: 'schedule' });
            CbtExamClass.belongsTo(models.Class, { foreignKey: 'class_id', as: 'classDetails' });
        }
    }
    CbtExamClass.init({
        schedule_id: { type: DataTypes.INTEGER, allowNull: false },
        class_id: { type: DataTypes.INTEGER, allowNull: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        sequelize,
        modelName: 'CbtExamClass',
        tableName: 'cbt_exam_classes',
        underscored: true,
        timestamps: false
    });
    return CbtExamClass;
};