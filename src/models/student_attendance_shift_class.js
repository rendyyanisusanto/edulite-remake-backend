'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentAttendanceShiftClass extends Model {
        static associate(models) {
            StudentAttendanceShiftClass.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            StudentAttendanceShiftClass.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class_info' });
            StudentAttendanceShiftClass.belongsTo(models.StudentAttendanceShift, { foreignKey: 'shift_id', as: 'shift' });
            StudentAttendanceShiftClass.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
        }
    }

    StudentAttendanceShiftClass.init(
        {
            academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
            class_id: { type: DataTypes.INTEGER, allowNull: false },
            shift_id: { type: DataTypes.INTEGER, allowNull: false },
            created_by: { type: DataTypes.INTEGER, allowNull: true }
        },
        {
            sequelize,
            modelName: 'StudentAttendanceShiftClass',
            tableName: 'student_attendance_shift_classes',
            updatedAt: false,
            underscored: true
        }
    );

    return StudentAttendanceShiftClass;
};

