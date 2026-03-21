'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttendanceRequest extends Model {
        static associate(models) {
            AttendanceRequest.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            AttendanceRequest.belongsTo(models.UserAttendance, { foreignKey: 'attendance_id', as: 'attendance' });
            AttendanceRequest.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
            AttendanceRequest.hasMany(models.AttendanceRequestLog, { foreignKey: 'attendance_request_id', as: 'logs' });
        }
    }
    AttendanceRequest.init({
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        attendance_id: { type: DataTypes.INTEGER, allowNull: true },
        attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
        request_type: {
            type: DataTypes.STRING(30),
            allowNull: false
        },
        request_status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'PENDING'
        },
        requested_clock_in_at: { type: DataTypes.DATE, allowNull: true },
        requested_clock_out_at: { type: DataTypes.DATE, allowNull: true },
        requested_clock_in_note: { type: DataTypes.TEXT, allowNull: true },
        requested_clock_out_note: { type: DataTypes.TEXT, allowNull: true },
        reason: { type: DataTypes.TEXT, allowNull: false },
        attachment_url: { type: DataTypes.STRING(255), allowNull: true },
        reviewed_by: { type: DataTypes.INTEGER, allowNull: true },
        reviewed_at: { type: DataTypes.DATE, allowNull: true },
        review_note: { type: DataTypes.TEXT, allowNull: true }
    }, {
        sequelize,
        modelName: 'AttendanceRequest',
        tableName: 'attendance_requests',
        underscored: true
    });
    return AttendanceRequest;
};
