'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentItemDepositSetting extends Model {
        static associate(models) {
            StudentItemDepositSetting.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
        }
    }

    StudentItemDepositSetting.init({
        allow_daily_loan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        loan_start_time: { type: DataTypes.TIME, allowNull: true },
        loan_end_time: { type: DataTypes.TIME, allowNull: true },
        return_deadline_time: { type: DataTypes.TIME, allowNull: true },
        require_staff_approval_for_borrow: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        require_staff_approval_for_return: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        max_active_loans_per_student: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'StudentItemDepositSetting',
        tableName: 'student_item_deposit_settings',
        underscored: true
    });

    return StudentItemDepositSetting;
};
