'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularSession extends Model {
        static associate(models) {
            ExtracurricularSession.belongsTo(models.Extracurricular, { foreignKey: 'extracurricular_id', as: 'extracurricular' });
            ExtracurricularSession.belongsTo(models.AcademicYear, { foreignKey: 'academic_year_id', as: 'academic_year' });
            ExtracurricularSession.belongsTo(models.ExtracurricularSchedule, { foreignKey: 'schedule_id', as: 'schedule' });
            ExtracurricularSession.belongsTo(models.ExtracurricularCoachAssignment, { foreignKey: 'coach_assignment_id', as: 'coach_assignment' });
            ExtracurricularSession.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
            ExtracurricularSession.belongsTo(models.User, { foreignKey: 'updated_by', as: 'updater' });
            ExtracurricularSession.hasMany(models.ExtracurricularStudentAttendance, { foreignKey: 'session_id', as: 'student_attendances' });
            ExtracurricularSession.hasMany(models.ExtracurricularStudentProgress, { foreignKey: 'session_id', as: 'progresses' });
        }
    }

    ExtracurricularSession.init({
        extracurricular_id: { type: DataTypes.INTEGER, allowNull: false },
        academic_year_id: { type: DataTypes.INTEGER, allowNull: false },
        schedule_id: { type: DataTypes.INTEGER, allowNull: true },
        coach_assignment_id: { type: DataTypes.INTEGER, allowNull: true },
        session_title: { type: DataTypes.STRING(150), allowNull: true },
        meeting_no: { type: DataTypes.INTEGER, allowNull: true },
        session_date: { type: DataTypes.DATEONLY, allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: true },
        end_time: { type: DataTypes.TIME, allowNull: true },
        actual_start_at: { type: DataTypes.DATE, allowNull: true },
        actual_end_at: { type: DataTypes.DATE, allowNull: true },
        location: { type: DataTypes.STRING(150), allowNull: true },
        material: { type: DataTypes.TEXT, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        coach_attendance_status: { type: DataTypes.STRING(30), allowNull: true },
        coach_checkin_at: { type: DataTypes.DATE, allowNull: true },
        coach_checkout_at: { type: DataTypes.DATE, allowNull: true },
        coach_note: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'DRAFT' },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER, allowNull: true }
    }, {
        sequelize,
        modelName: 'ExtracurricularSession',
        tableName: 'extracurricular_sessions',
        underscored: true
    });

    return ExtracurricularSession;
};
