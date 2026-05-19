'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class AcademicYear extends Model {
        static associate(models) {
            AcademicYear.hasMany(models.StudentClassHistory, { foreignKey: 'academic_year_id', as: 'class_histories' });
            AcademicYear.hasMany(models.Extracurricular, { foreignKey: 'academic_year_id', as: 'extracurriculars' });
            AcademicYear.hasMany(models.ExtracurricularRegistration, { foreignKey: 'academic_year_id', as: 'extracurricular_registrations' });
            AcademicYear.hasMany(models.ExtracurricularMember, { foreignKey: 'academic_year_id', as: 'extracurricular_members' });
            AcademicYear.hasMany(models.ExtracurricularSession, { foreignKey: 'academic_year_id', as: 'extracurricular_sessions' });
            AcademicYear.hasMany(models.ExtracurricularStudentProgress, { foreignKey: 'academic_year_id', as: 'extracurricular_student_progresses' });
            AcademicYear.hasMany(models.StudentMutation, { foreignKey: 'academic_year_id', as: 'student_mutations' });
            AcademicYear.hasMany(models.StudentAttendanceShift, { foreignKey: 'academic_year_id', as: 'student_attendance_shifts' });
            AcademicYear.hasMany(models.StudentAttendanceShiftClass, { foreignKey: 'academic_year_id', as: 'student_attendance_shift_classes' });
            AcademicYear.hasMany(models.StudentAttendanceShiftStudent, { foreignKey: 'academic_year_id', as: 'student_attendance_shift_students' });
            AcademicYear.hasMany(models.StudentDailyAttendance, { foreignKey: 'academic_year_id', as: 'student_daily_attendances' });
            AcademicYear.hasMany(models.StudentToiletPermission, { foreignKey: 'academic_year_id', as: 'student_toilet_permissions' });
        }
    }
    AcademicYear.init({
        name: {
            type: DataTypes.STRING(50)
        },
        start_date: {
            type: DataTypes.DATEONLY
        },
        end_date: {
            type: DataTypes.DATEONLY
        },
        is_active: {
            type: DataTypes.BOOLEAN
        }
    }, {
        sequelize,
        modelName: 'AcademicYear',
        tableName: 'academic_years',
        underscored: true,
    });
    return AcademicYear;
};
