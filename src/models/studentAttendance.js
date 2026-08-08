'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentAttendance extends Model {
        static associate(models) {
            // Relasi ke Student
            StudentAttendance.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });

            // Relasi ke User (created_by dan updated_by)
            StudentAttendance.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            StudentAttendance.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
        }
    }

    StudentAttendance.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        attendance_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'),
            allowNull: false,
            defaultValue: 'HADIR'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        input_method: {
            type: DataTypes.ENUM('rfid', 'manual', 'import'),
            allowNull: false,
            defaultValue: 'manual'
        },
        clock_in_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        clock_out_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        late_minutes: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        sequelize,
        modelName: 'StudentAttendance',
        tableName: 'student_attendances',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });

    return StudentAttendance;
};
