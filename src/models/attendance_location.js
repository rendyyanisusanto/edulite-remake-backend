'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttendanceLocation extends Model {
        static associate(models) {
            AttendanceLocation.hasMany(models.UserAttendance, { foreignKey: 'clock_in_location_id', as: 'clock_in_attendances' });
            AttendanceLocation.hasMany(models.UserAttendance, { foreignKey: 'clock_out_location_id', as: 'clock_out_attendances' });
        }
    }
    AttendanceLocation.init({
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        code: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false
        },
        longitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false
        },
        radius_meters: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100
        },
        location_type: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'AttendanceLocation',
        tableName: 'attendance_locations',
        underscored: true
    });
    return AttendanceLocation;
};
