'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttendanceSetting extends Model {
        static associate(models) {
            AttendanceSetting.belongsTo(models.AttendanceShift, { foreignKey: 'active_shift_id', as: 'active_shift' });
            AttendanceSetting.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
        }
    }
    AttendanceSetting.init({
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            defaultValue: 'Default Setting'
        },
        center_lat: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false
        },
        center_lng: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false
        },
        radius_meters: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 100
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        allow_outside_radius: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        require_selfie: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        require_note_outside_radius: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        min_gps_accuracy_meters: {
            type: DataTypes.DECIMAL(8, 2),
            defaultValue: 100.00
        },
        clock_in_tolerance_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        clock_out_tolerance_minutes: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        active_shift_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'AttendanceSetting',
        tableName: 'attendance_settings',
        underscored: true
    });
    return AttendanceSetting;
};
