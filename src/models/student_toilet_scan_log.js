'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentToiletScanLog extends Model {
        static associate(models) {
            StudentToiletScanLog.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentToiletScanLog.belongsTo(models.StudentToiletPermission, { foreignKey: 'toilet_permission_id', as: 'toilet_permission' });
        }
    }

    StudentToiletScanLog.init(
        {
            student_id: { type: DataTypes.INTEGER, allowNull: true },
            toilet_permission_id: { type: DataTypes.INTEGER, allowNull: true },
            scanned_rfid_code: { type: DataTypes.STRING(100), allowNull: false },
            scanned_at: { type: DataTypes.DATE, allowNull: false },
            scan_type: { type: DataTypes.STRING(20), allowNull: true },
            result_status: { type: DataTypes.STRING(30), allowNull: false },
            result_message: { type: DataTypes.STRING(255), allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentToiletScanLog',
            tableName: 'student_toilet_scan_logs',
            updatedAt: false,
            underscored: true
        }
    );

    return StudentToiletScanLog;
};

