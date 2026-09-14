'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentUserAccount extends Model {
        static associate(models) {
            StudentUserAccount.belongsTo(models.Student, { foreignKey: 'student_id' });
            StudentUserAccount.belongsTo(models.User, { foreignKey: 'user_id' });
            if (models.Student) models.Student.hasOne(models.StudentUserAccount, { foreignKey: 'student_id' });
            if (models.User) models.User.hasOne(models.StudentUserAccount, { foreignKey: 'user_id' });
        }
    }
    StudentUserAccount.init({
        student_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }
    }, {
        sequelize,
        modelName: 'StudentUserAccount',
        tableName: 'student_user_accounts',
        underscored: true,
        timestamps: true
    });
    return StudentUserAccount;
};