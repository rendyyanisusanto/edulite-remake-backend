'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentLeaveRequest extends Model {
        static associate(models) {
            StudentLeaveRequest.belongsTo(models.Student, {
                foreignKey: 'student_id',
                as: 'student'
            });
        }
    }
    StudentLeaveRequest.init({
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        leave_type: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        attachment: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'pending' // pending, approved, rejected
        }
    }, {
        sequelize,
        modelName: 'StudentLeaveRequest',
        tableName: 'student_leave_requests',
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    });
    return StudentLeaveRequest;
};
