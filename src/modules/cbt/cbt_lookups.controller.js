'use strict';
const db = require('../../models');
const { Op } = require('sequelize');

exports.getTeachers = async (req, res, next) => {
    try {
        const { search, limit = 50 } = req.query;
        let where = {};
        if (search) {
            where[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { nip: { [Op.like]: `%${search}%` } }
            ];
        }

        const teachers = await db.Teacher.findAll({
            where,
            attributes: ['id', ['full_name', 'name'], 'nip'],
            limit: parseInt(limit, 10),
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: teachers });
    } catch (error) { next(error); }
};

exports.getSubjects = async (req, res, next) => {
    try {
        const { search, limit = 50 } = req.query;
        let where = { is_active: true };
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } }
            ];
        }

        const subjects = await db.Subject.findAll({
            where,
            attributes: ['id', 'name', 'code', 'subject_type'],
            limit: parseInt(limit, 10),
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: subjects });
    } catch (error) { next(error); }
};

exports.getAcademicYears = async (req, res, next) => {
    try {
        const data = await db.AcademicYear.findAll({
            attributes: ['id', 'name', 'start_date', 'end_date', 'is_active'],
            order: [['start_date', 'DESC']]
        });
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

exports.getGrades = async (req, res, next) => {
    try {
        const data = await db.Grade.findAll({
            attributes: ['id', 'name', 'level'],
            order: [['level', 'ASC']]
        });
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

exports.getDepartments = async (req, res, next) => {
    try {
        const data = await db.Department.findAll({
            attributes: ['id', 'name', 'code'],
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data });
    } catch (error) { next(error); }
};

exports.getClasses = async (req, res, next) => {
    try {
        const { grade_id, department_id, include_relations = 'false' } = req.query;
        let where = {};
        if (grade_id) where.grade_id = grade_id;
        if (department_id) where.department_id = department_id;

        const include = [];
        if (include_relations === 'true') {
            include.push({ model: db.Grade, as: 'grade', attributes: ['name'] });
            include.push({ model: db.Department, as: 'department', attributes: ['name', 'code'] });
        }

        const items = await db.Class.findAll({
            where,
            attributes: ['id', 'name', 'grade_id', 'department_id'],
            include,
            order: [['name', 'ASC']]
        });
        res.json({ success: true, data: items });
    } catch (error) { next(error); }
};
