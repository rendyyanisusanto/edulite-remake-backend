'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentItemFinalReturn extends Model {
        static associate(models) {
            StudentItemFinalReturn.belongsTo(models.StudentItemDeposit, { foreignKey: 'deposit_id', as: 'deposit' });
            StudentItemFinalReturn.belongsTo(models.User, { foreignKey: 'handed_by', as: 'handedBy' });
            StudentItemFinalReturn.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
            StudentItemFinalReturn.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
        }
    }

    StudentItemFinalReturn.init({
        deposit_id: { type: DataTypes.INTEGER, allowNull: false },
        return_date: { type: DataTypes.DATE, allowNull: false },
        returned_to: { type: DataTypes.STRING(150), allowNull: false },
        returned_to_type: { type: DataTypes.STRING(30), allowNull: false },
        returned_to_relation: { type: DataTypes.STRING(100), allowNull: true },
        return_reason: { type: DataTypes.TEXT, allowNull: true },
        condition_out: { type: DataTypes.TEXT, allowNull: true },
        handed_by: { type: DataTypes.INTEGER, allowNull: false },
        photo_out: { type: DataTypes.STRING(255), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'StudentItemFinalReturn',
        tableName: 'student_item_final_returns',
        underscored: true
    });

    return StudentItemFinalReturn;
};
