'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CbtExamSchedule extends Model {
        static associate(models) {
            CbtExamSchedule.belongsTo(models.CbtExam, { foreignKey: 'exam_id', as: 'exam' });
            CbtExamSchedule.hasMany(models.CbtExamClass, { foreignKey: 'schedule_id', as: 'examClasses' });
            CbtExamSchedule.hasMany(models.CbtExamParticipant, { foreignKey: 'schedule_id', as: 'participants' });
        }
    }
    CbtExamSchedule.init({
        exam_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING(100), defaultValue: 'Reguler' },
        start_at: { type: DataTypes.DATE, allowNull: false },
        end_at: { type: DataTypes.DATE, allowNull: false },
        duration_minutes: { type: DataTypes.INTEGER },
        token_hash: { type: DataTypes.STRING(255) },
        late_tolerance_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: { type: DataTypes.STRING(20), defaultValue: 'SCHEDULED' },
        created_by: { type: DataTypes.INTEGER, allowNull: false },
        updated_by: { type: DataTypes.INTEGER }
    }, {
        sequelize,
        modelName: 'CbtExamSchedule',
        tableName: 'cbt_exam_schedules',
        underscored: true,
        timestamps: true
    });
    return CbtExamSchedule;
};