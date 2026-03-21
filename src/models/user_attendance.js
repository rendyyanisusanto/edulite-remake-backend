'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UserAttendance extends Model {
        static associate(models) {
            UserAttendance.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            UserAttendance.belongsTo(models.AttendanceShift, { foreignKey: 'shift_id', as: 'shift' });
            UserAttendance.belongsTo(models.AttendanceLocation, { foreignKey: 'clock_in_location_id', as: 'clock_in_location' });
            UserAttendance.belongsTo(models.AttendanceLocation, { foreignKey: 'clock_out_location_id', as: 'clock_out_location' });
            UserAttendance.hasMany(models.AttendanceRequest, { foreignKey: 'attendance_id', as: 'requests' });
        }
    }
    UserAttendance.init({
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
        shift_id: { type: DataTypes.INTEGER, allowNull: true },
        // Clock In
        clock_in_at: { type: DataTypes.DATE, allowNull: true },
        clock_in_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
        clock_in_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
        clock_in_accuracy: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        clock_in_distance_meters: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        clock_in_location_id: { type: DataTypes.INTEGER, allowNull: true },
        clock_in_status: { type: DataTypes.STRING(30), allowNull: true },
        clock_in_method: { type: DataTypes.STRING(30), allowNull: true },
        clock_in_selfie_url: { type: DataTypes.STRING(255), allowNull: true },
        clock_in_note: { type: DataTypes.TEXT, allowNull: true },
        // Clock Out
        clock_out_at: { type: DataTypes.DATE, allowNull: true },
        clock_out_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
        clock_out_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
        clock_out_accuracy: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        clock_out_distance_meters: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
        clock_out_location_id: { type: DataTypes.INTEGER, allowNull: true },
        clock_out_status: { type: DataTypes.STRING(30), allowNull: true },
        clock_out_method: { type: DataTypes.STRING(30), allowNull: true },
        clock_out_selfie_url: { type: DataTypes.STRING(255), allowNull: true },
        clock_out_note: { type: DataTypes.TEXT, allowNull: true },
        // Summary
        work_duration_minutes: { type: DataTypes.INTEGER, allowNull: true },
        attendance_status: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: 'PRESENT'
        },
        note: { type: DataTypes.TEXT, allowNull: true }
    }, {
        sequelize,
        modelName: 'UserAttendance',
        tableName: 'user_attendances',
        underscored: true
    });
    return UserAttendance;
};
