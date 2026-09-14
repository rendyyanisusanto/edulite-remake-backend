'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtExamParticipant extends Model {
        static associate(models) {
            CbtExamParticipant.belongsTo(models.CbtExamSchedule, { foreignKey: 'schedule_id', as: 'schedule' });
            CbtExamParticipant.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            CbtExamParticipant.belongsTo(models.Class, { foreignKey: 'class_id', as: 'classDetails' });
            CbtExamParticipant.hasMany(models.CbtAttempt, { foreignKey: 'participant_id', as: 'attempts' });
        }
    }
    CbtExamParticipant.init({
        schedule_id: { type: DataTypes.INTEGER, allowNull: false },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        class_id: { type: DataTypes.INTEGER, allowNull: false },
        attendance_status: { type: DataTypes.STRING(20), defaultValue: 'REGISTERED' },
        participant_status: { type: DataTypes.STRING(20), defaultValue: 'NOT_STARTED' },
        extra_time_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_eligible: { type: DataTypes.BOOLEAN, defaultValue: true },
        notes: { type: DataTypes.STRING(500) }
    }, {
        sequelize,
        modelName: 'CbtExamParticipant',
        tableName: 'cbt_exam_participants',
        underscored: true,
        timestamps: true
    });
    return CbtExamParticipant;
};