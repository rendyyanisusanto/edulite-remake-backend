'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttendanceRequestLog extends Model {
        static associate(models) {
            AttendanceRequestLog.belongsTo(models.AttendanceRequest, { foreignKey: 'attendance_request_id', as: 'request' });
            AttendanceRequestLog.belongsTo(models.User, { foreignKey: 'action_by', as: 'actor' });
        }
    }
    AttendanceRequestLog.init({
        attendance_request_id: { type: DataTypes.INTEGER, allowNull: false },
        action: { type: DataTypes.STRING(30), allowNull: false },
        action_by: { type: DataTypes.INTEGER, allowNull: false },
        action_note: { type: DataTypes.TEXT, allowNull: true }
    }, {
        sequelize,
        modelName: 'AttendanceRequestLog',
        tableName: 'attendance_request_logs',
        underscored: true,
        updatedAt: false
    });
    return AttendanceRequestLog;
};
