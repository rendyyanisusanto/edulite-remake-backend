'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ExtracurricularStudentAttendance extends Model {
        static associate(models) {
            ExtracurricularStudentAttendance.belongsTo(models.ExtracurricularSession, { foreignKey: 'session_id', as: 'session' });
            ExtracurricularStudentAttendance.belongsTo(models.ExtracurricularMember, { foreignKey: 'extracurricular_member_id', as: 'member' });
            ExtracurricularStudentAttendance.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
            ExtracurricularStudentAttendance.belongsTo(models.User, { foreignKey: 'marked_by', as: 'marker' });
        }
    }

    ExtracurricularStudentAttendance.init({
        session_id: { type: DataTypes.INTEGER, allowNull: false },
        extracurricular_member_id: { type: DataTypes.INTEGER, allowNull: false },
        student_id: { type: DataTypes.INTEGER, allowNull: false },
        attendance_status: { type: DataTypes.STRING(30), allowNull: false },
        checkin_at: { type: DataTypes.DATE, allowNull: true },
        note: { type: DataTypes.TEXT, allowNull: true },
        marked_by: { type: DataTypes.INTEGER, allowNull: false },
        marked_at: { type: DataTypes.DATE, allowNull: false }
    }, {
        sequelize,
        modelName: 'ExtracurricularStudentAttendance',
        tableName: 'extracurricular_student_attendances',
        createdAt: false,
        updatedAt: false,
        underscored: true
    });

    return ExtracurricularStudentAttendance;
};
