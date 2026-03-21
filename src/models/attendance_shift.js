'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AttendanceShift extends Model {
        static associate(models) {
            AttendanceShift.hasMany(models.UserAttendance, { foreignKey: 'shift_id', as: 'attendances' });
            AttendanceShift.hasMany(models.AttendanceSetting, { foreignKey: 'active_shift_id', as: 'settings' });
        }
    }
    AttendanceShift.init({
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: { msg: 'Shift name is required' } }
        },
        code: {
            type: DataTypes.STRING(30),
            allowNull: true
        },
        clock_in_start: {
            type: DataTypes.TIME,
            allowNull: false
        },
        clock_in_end: {
            type: DataTypes.TIME,
            allowNull: false
        },
        clock_out_start: {
            type: DataTypes.TIME,
            allowNull: true
        },
        clock_out_end: {
            type: DataTypes.TIME,
            allowNull: true
        },
        late_after: {
            type: DataTypes.TIME,
            allowNull: true
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        sequelize,
        modelName: 'AttendanceShift',
        tableName: 'attendance_shifts',
        underscored: true
    });
    return AttendanceShift;
};
