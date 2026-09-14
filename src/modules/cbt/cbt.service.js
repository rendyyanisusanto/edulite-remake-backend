'use strict';
const db = require('../../models');

class CbtService {
    async getDashboardSummary() {
        try {
            const questionBanks = await db.CbtQuestionBank.count({ where: { status: 'ACTIVE' } });
            const questions = await db.CbtQuestion.count({ where: { status: 'ACTIVE' } });
            const exams = await db.CbtExam.count();
            const schedules = await db.CbtExamSchedule.count();
            const participants = await db.CbtExamParticipant.count();
            const activeExams = await db.CbtExamSchedule.count({ where: { status: 'OPEN' } });

            // Master CBT counts
            const teacherAssignments = await db.CbtTeacherAssignment.count({ where: { is_active: true } });

            const activeStudentAccounts = await db.User.count({
                include: [{ model: db.StudentUserAccount, required: true }],
                where: { is_active: true }
            });

            // studentsWithoutAccounts: aktif namun tidak punya relasi
            const studentsWithoutAccounts = await db.Student.count({
                include: [{ model: db.StudentUserAccount, required: false }],
                where: {
                    '$StudentUserAccount.id$': null,
                    student_status: { [db.Sequelize.Op.in]: ['ACTIVE', 'AKTIF'] }
                }
            });

            return {
                questionBanks,
                questions,
                exams,
                schedules,
                participants,
                activeExams,
                teacherAssignments,
                activeStudentAccounts,
                studentsWithoutAccounts
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new CbtService();
