'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentItemDeposit extends Model {
        static associate(models) {
            StudentItemDeposit.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentItemDeposit.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentItemDeposit.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
            StudentItemDeposit.belongsTo(models.StudentItemCategory, { foreignKey: 'category_id', as: 'category' });
            StudentItemDeposit.belongsTo(models.User, { foreignKey: 'received_by', as: 'receivedBy' });
            StudentItemDeposit.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
            StudentItemDeposit.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
            StudentItemDeposit.hasMany(models.StudentItemLoan, { foreignKey: 'deposit_id', as: 'loans' });
            StudentItemDeposit.hasMany(models.StudentItemDepositLog, { foreignKey: 'deposit_id', as: 'logs' });
            StudentItemDeposit.hasMany(models.StudentItemFinalReturn, { foreignKey: 'deposit_id', as: 'finalReturns' });
        }
    }

    StudentItemDeposit.init({
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: true },
        class_id: { type: DataTypes.INTEGER, allowNull: true },
        category_id: { type: DataTypes.INTEGER, allowNull: false },
        item_name: { type: DataTypes.STRING(150), allowNull: false },
        brand: { type: DataTypes.STRING(100), allowNull: true },
        model: { type: DataTypes.STRING(100), allowNull: true },
        color: { type: DataTypes.STRING(50), allowNull: true },
        serial_number: { type: DataTypes.STRING(100), allowNull: true },
        imei: { type: DataTypes.STRING(100), allowNull: true },
        condition_in: { type: DataTypes.TEXT, allowNull: true },
        accessories: { type: DataTypes.TEXT, allowNull: true },
        storage_location: { type: DataTypes.STRING(150), allowNull: true },
        deposit_date: { type: DataTypes.DATE, allowNull: false },
        received_by: { type: DataTypes.INTEGER, allowNull: false },
        current_status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'DEPOSITED' },
        photo_in: { type: DataTypes.STRING(255), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'StudentItemDeposit',
        tableName: 'student_item_deposits',
        underscored: true
    });

    return StudentItemDeposit;
};
