'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentAttendanceShiftStudent extends Model {
        static associate(models) {
            StudentAttendanceShiftStudent.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentAttendanceShiftStudent.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            StudentAttendanceShiftStudent.belongsTo(models.StudentAttendanceShift, { foreignKey: 'shift_id', as: 'shift' });
            StudentAttendanceShiftStudent.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
        }
    }

    StudentAttendanceShiftStudent.init(
        {
            academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
            student_id: { type: DataTypes.INTEGER, allowNull: false },
            shift_id: { type: DataTypes.INTEGER, allowNull: false },
            start_date: { type: DataTypes.DATEONLY, allowNull: true },
            end_date: { type: DataTypes.DATEONLY, allowNull: true },
            notes: { type: DataTypes.TEXT, allowNull: true },
            created_by: { type: DataTypes.INTEGER, allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentAttendanceShiftStudent',
            tableName: 'student_attendance_shift_students',
            updatedAt: false,
            underscored: true
        }
    );

    return StudentAttendanceShiftStudent;
};

