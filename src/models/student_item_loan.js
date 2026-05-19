'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentItemLoan extends Model {
        static associate(models) {
            StudentItemLoan.belongsTo(models.StudentItemDeposit, { foreignKey: 'deposit_id', as: 'deposit' });
            StudentItemLoan.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentItemLoan.belongsTo(models.User, { foreignKey: 'borrow_approved_by', as: 'borrowApprovedBy' });
            StudentItemLoan.belongsTo(models.User, { foreignKey: 'return_confirmed_by', as: 'returnConfirmedBy' });
            StudentItemLoan.belongsTo(models.User, { foreignKey: 'created_by', as: 'createdBy' });
            StudentItemLoan.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updatedBy' });
        }
    }

    StudentItemLoan.init({
        deposit_id: { type: DataTypes.INTEGER, allowNull: false },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        loan_date: { type: DataTypes.DATEONLY, allowNull: false },
        borrowed_at: { type: DataTypes.DATE, allowNull: false },
        returned_at: { type: DataTypes.DATE, allowNull: true },
        borrow_method: { type: DataTypes.STRING(30), allowNull: false },
        return_method: { type: DataTypes.STRING(30), allowNull: true },
        borrow_rfid_code: { type: DataTypes.STRING(100), allowNull: true },
        return_rfid_code: { type: DataTypes.STRING(100), allowNull: true },
        borrow_approved_by: { type: DataTypes.INTEGER, allowNull: true },
        return_confirmed_by: { type: DataTypes.INTEGER, allowNull: true },
        borrow_note: { type: DataTypes.TEXT, allowNull: true },
        return_note: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'BORROWED' },
        created_by: { type: DataTypes.INTEGER, allowNull: true },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'StudentItemLoan',
        tableName: 'student_item_loans',
        underscored: true
    });

    return StudentItemLoan;
};
