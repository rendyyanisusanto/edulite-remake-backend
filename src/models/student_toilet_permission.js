'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentToiletPermission extends Model {
        static associate(models) {
            StudentToiletPermission.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentToiletPermission.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentToiletPermission.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class_info' });
            StudentToiletPermission.hasMany(models.StudentToiletScanLog, { foreignKey: 'toilet_permission_id', as: 'scan_logs' });
        }
    }

    StudentToiletPermission.init(
        {
            student_id: { type: DataTypes.INTEGER, allowNull: false },
            academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
            class_id: { type: DataTypes.INTEGER, allowNull: true },
            permission_date: { type: DataTypes.DATEONLY, allowNull: false },
            exit_at: { type: DataTypes.DATE, allowNull: true },
            return_at: { type: DataTypes.DATE, allowNull: true },
            duration_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'OUT' },
            note: { type: DataTypes.TEXT, allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentToiletPermission',
            tableName: 'student_toilet_permissions',
            underscored: true
        }
    );

    return StudentToiletPermission;
};

