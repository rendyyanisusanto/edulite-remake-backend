'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentItemDepositLog extends Model {
        static associate(models) {
            StudentItemDepositLog.belongsTo(models.StudentItemDeposit, { foreignKey: 'deposit_id', as: 'deposit' });
            StudentItemDepositLog.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
        }
    }

    StudentItemDepositLog.init({
        deposit_id: { type: DataTypes.INTEGER, allowNull: false },
        action: { type: DataTypes.STRING(50), allowNull: false },
        old_status: { type: DataTypes.STRING(30), allowNull: true },
        new_status: { type: DataTypes.STRING(30), allowNull: true },
        source: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'WEB_ADMIN' },
        note: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'StudentItemDepositLog',
        tableName: 'student_item_deposit_logs',
        underscored: true,
        updatedAt: false
    });

    return StudentItemDepositLog;
};
