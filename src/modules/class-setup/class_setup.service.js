'use strict';

const db = require('../../models');
const { StudentClassHistory, Student, Grade, Class, Teacher } = db;
const { Op } = require('sequelize');
const sequelize = db.sequelize;

class ClassSetupService {

    /**
     * Get summary stats: total classes, assigned students, unassigned students, remaining capacity
     */
    async getSummary(academic_year_id, grade_id) {
        const classWhere = {};
        if (grade_id) classWhere.grade_id = grade_id;

        const classes = await Class.findAll({ where: classWhere });
        const classIds = classes.map(c => c.id);

        const historyWhere = { academic_year_id };
        if (classIds.length > 0) historyWhere.class_id = { [Op.in]: classIds };
        if (grade_id) historyWhere.grade_id = grade_id;

        const assignedCount = await StudentClassHistory.count({ where: historyWhere });

        // Get unassigned count: students who have NO history for this academic year
        const assignedStudentIds = await StudentClassHistory.findAll({
            where: { academic_year_id },
            attributes: ['student_id']
        });
        const assignedIds = assignedStudentIds.map(r => r.student_id);

        const unassignedCount = await Student.count({
            where: assignedIds.length > 0 ? { id: { [Op.notIn]: assignedIds } } : {}
        });

        const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || 0), 0);
        const remainingCapacity = totalCapacity - assignedCount;

        return {
            total_classes: classes.length,
            assigned_students: assignedCount,
            unassigned_students: unassignedCount,
            total_capacity: totalCapacity,
            remaining_capacity: Math.max(0, remainingCapacity)
        };
    }

    /**
     * Get all classes with occupancy info and current student members
     */
    async getClasses(academic_year_id, grade_id) {
        const classWhere = {};
        if (grade_id) classWhere.grade_id = grade_id;

        const classes = await Class.findAll({
            where: classWhere,
            include: [
                { model: Grade, as: 'grade', attributes: ['id', 'name', 'level'] },
                {
                    model: Teacher,
                    as: 'homeroom_teacher',
                    attributes: ['id', 'full_name', 'nip']
                }
            ],
            order: [['name', 'ASC']]
        });

        const result = [];

        for (const cls of classes) {
            const members = await StudentClassHistory.findAll({
                where: { class_id: cls.id, academic_year_id },
                include: [
                    { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name', 'gender'] }
                ],
                order: [[{ model: Student, as: 'student' }, 'full_name', 'ASC']]
            });

            const occupied = members.length;
            const capacity = cls.capacity || 0;
            const remaining = Math.max(0, capacity - occupied);

            let occupancy_status = 'normal';
            if (capacity > 0) {
                const ratio = occupied / capacity;
                if (ratio >= 1) occupancy_status = 'full';
                else if (ratio >= 0.85) occupancy_status = 'warning';
            }

            result.push({
                id: cls.id,
                name: cls.name,
                grade: cls.grade,
                homeroom_teacher: cls.homeroom_teacher,
                capacity,
                occupied,
                remaining,
                occupancy_status,
                members: members.map(m => ({ history_id: m.id, ...m.student.toJSON() }))
            });
        }

        return result;
    }

    /**
     * Get students who have no class assignment in the given academic year
     */
    async getUnassignedStudents(filters = {}) {
        const { academic_year_id, search = '', page = 1, limit = 50, gender } = filters;

        const assignedStudentIds = await StudentClassHistory.findAll({
            where: { academic_year_id },
            attributes: ['student_id']
        });
        const assignedIds = assignedStudentIds.map(r => r.student_id);

        const studentWhere = {};
        if (assignedIds.length > 0) {
            studentWhere.id = { [Op.notIn]: assignedIds };
        }
        if (search) {
            studentWhere[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { nis: { [Op.like]: `%${search}%` } },
                { nisn: { [Op.like]: `%${search}%` } }
            ];
        }
        if (gender) studentWhere.gender = gender;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Student.findAndCountAll({
            where: studentWhere,
            attributes: ['id', 'nis', 'nisn', 'full_name', 'gender'],
            limit: parseInt(limit),
            offset,
            order: [['full_name', 'ASC']]
        });

        return {
            totalItems: count,
            students: rows,
            totalPages: Math.ceil(count / parseInt(limit)),
            currentPage: parseInt(page)
        };
    }

    /**
     * Bulk assign students to a class. Skips already-assigned students.
     */
    async bulkAssign(data) {
        const { academic_year_id, grade_id, class_id, student_ids, assigned_by } = data;

        if (!academic_year_id || !grade_id || !class_id || !student_ids?.length) {
            throw new Error('academic_year_id, grade_id, class_id, dan minimal satu student_id wajib diisi');
        }

        // Check target class capacity
        const targetClass = await Class.findByPk(class_id);
        if (!targetClass) throw new Error('Kelas tujuan tidak ditemukan');

        const existingCount = await StudentClassHistory.count({
            where: { class_id, academic_year_id }
        });

        if (targetClass.capacity && (existingCount + student_ids.length) > targetClass.capacity) {
            throw new Error(`Kapasitas kelas ${targetClass.name} tidak mencukupi. Tersisa ${targetClass.capacity - existingCount} kursi.`);
        }

        const transaction = await sequelize.transaction();
        try {
            // Find which students already have a class this academic year
            const existing = await StudentClassHistory.findAll({
                where: { student_id: { [Op.in]: student_ids }, academic_year_id },
                attributes: ['student_id'],
                transaction
            });
            const alreadyAssigned = new Set(existing.map(r => r.student_id));

            const newStudentIds = student_ids.filter(id => !alreadyAssigned.has(id));

            if (newStudentIds.length === 0) {
                await transaction.rollback();
                return { assigned: 0, skipped: student_ids.length, message: 'Semua siswa sudah memiliki kelas di tahun ajaran ini.' };
            }

            const records = newStudentIds.map(student_id => ({
                student_id,
                academic_year_id,
                grade_id,
                class_id,
                assigned_by,
                assignment_type: 'MANUAL',
                created_at: new Date()
            }));

            await StudentClassHistory.bulkCreate(records, { transaction });
            await transaction.commit();

            return {
                assigned: newStudentIds.length,
                skipped: alreadyAssigned.size,
                message: `${newStudentIds.length} siswa berhasil ditempatkan ke kelas.`
            };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    /**
     * Bulk move students from one class to another within the same academic year.
     * Uses update (replace) approach: updates the existing SCH record.
     */
    async bulkMove(data) {
        const { academic_year_id, from_class_id, to_class_id, student_ids, assigned_by } = data;

        if (!academic_year_id || !from_class_id || !to_class_id || !student_ids?.length) {
            throw new Error('academic_year_id, from_class_id, to_class_id, dan minimal satu student_id wajib diisi');
        }
        if (from_class_id === to_class_id) {
            throw new Error('Kelas asal dan kelas tujuan tidak boleh sama');
        }

        const toClass = await Class.findByPk(to_class_id);
        if (!toClass) throw new Error('Kelas tujuan tidak ditemukan');

        // Check capacity of destination class
        const existingInDest = await StudentClassHistory.count({
            where: { class_id: to_class_id, academic_year_id }
        });
        if (toClass.capacity && (existingInDest + student_ids.length) > toClass.capacity) {
            throw new Error(`Kapasitas kelas ${toClass.name} tidak mencukupi. Tersisa ${toClass.capacity - existingInDest} kursi.`);
        }

        const transaction = await sequelize.transaction();
        try {
            // Get the grade_id from destination class
            const destGradeId = toClass.grade_id;

            const [updatedCount] = await StudentClassHistory.update(
                { class_id: to_class_id, grade_id: destGradeId, assigned_by, assignment_type: 'MANUAL' },
                {
                    where: {
                        student_id: { [Op.in]: student_ids },
                        class_id: from_class_id,
                        academic_year_id
                    },
                    transaction
                }
            );

            await transaction.commit();
            return {
                moved: updatedCount,
                message: `${updatedCount} siswa berhasil dipindahkan ke kelas ${toClass.name}.`
            };
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    /**
     * Remove a student's class assignment (delete history record by id)
     */
    async removeAssignment(history_id) {
        const record = await StudentClassHistory.findByPk(history_id);
        if (!record) throw new Error('Data riwayat kelas tidak ditemukan');
        await record.destroy();
        return true;
    }
}

module.exports = new ClassSetupService();
