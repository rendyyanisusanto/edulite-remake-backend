const publicService = require('./public.service');

exports.getStudentDashboard = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, filter } = req.query;
        
        // If date is not provided, use today's date in local timezone
        const targetDate = date || new Date().toLocaleString('sv', { timeZone: 'Asia/Jakarta' }).split(' ')[0];

        const data = await publicService.getStudentDashboard(id, targetDate, filter);
        
        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Student not found',
                data: null
            });
        }
        
        return res.json({
            success: true,
            message: 'Student dashboard retrieved successfully',
            data: data
        });
    } catch (error) {
        next(error);
    }
};

const { Student, Class, Sequelize } = require('../../models');
const { Op } = Sequelize;
const attendanceScanService = require('../student-attendance/student_attendance_scan.service');
const toiletScanService = require('../student-toilet/student_toilet_scan.service');
const toiletQueryService = require('../student-toilet/student_toilet_query.service');

const validateKioskToken = (req) => {
    const token = req.query?.kiosk_token || req.body?.kiosk_token || req.headers?.['x-kiosk-token'];
    const validTokens = [
        process.env.RFID_GATE_KIOSK_TOKEN,
        process.env.RFID_TOILET_KIOSK_TOKEN,
        process.env.KIOSK_INTERNAL_TOKEN
    ].filter(Boolean);
    
    return validTokens.includes(token);
};

exports.kioskManualSearchStudents = async (req, res, next) => {
    try {
        if (!validateKioskToken(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }
        const keyword = String(req.query.q || '').trim();
        const students = await Student.findAll({
            where: {
                [Op.or]: [
                    { full_name: { [Op.like]: `%${keyword}%` } },
                    { nis: { [Op.like]: `%${keyword}%` } }
                ]
            },
            attributes: ['id', 'full_name', 'nis'],
            limit: 20
        });
        return res.json({ success: true, data: students });
    } catch (error) {
        next(error);
    }
};

exports.kioskManualAttendanceScan = async (req, res, next) => {
    try {
        if (!validateKioskToken(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }
        if (!req.body.student_id) {
            return res.status(400).json({ success: false, message: 'student_id is required' });
        }
        const result = await attendanceScanService.scan({ ...req.body, is_manual: true });
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.kioskManualToiletCurrentlyOut = async (req, res, next) => {
    try {
        if (!validateKioskToken(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }
        const summary = await toiletQueryService.getSummary({ date: req.query.date });
        const currentlyOut = (summary.currently_out || []).map(p => ({
            id: p.id,
            student_id: p.student_id,
            full_name: p.student?.full_name || '-',
            nis: p.student?.nis || '-',
            class_name: p.class_info?.name || '-',
            exit_at: p.exit_at
        }));
        return res.json({ success: true, data: currentlyOut });
    } catch (error) {
        next(error);
    }
};

exports.kioskManualToiletScan = async (req, res, next) => {
    try {
        if (!validateKioskToken(req)) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }
        if (!req.body.student_id) {
            return res.status(400).json({ success: false, message: 'student_id is required' });
        }
        const result = await toiletScanService.scan({ ...req.body, is_manual: true });
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.verifyDocument = async (req, res, next) => {
    try {
        const { type, id, token } = req.query;
        if (!type || !id || !token) {
            return res.status(400).json({ success: false, message: 'Type, ID, and Token are required' });
        }

        const crypto = require('crypto');
        const secret = process.env.VERIFY_SECRET || 'edulite-secret-2026';
        const expectedToken = crypto.createHash('md5').update(`${type}-${id}-${secret}`).digest('hex');

        if (token !== expectedToken) {
            return res.status(400).json({ success: false, message: 'Invalid verify token. Document might be forged.' });
        }

        if (type === 'violation') {
            const { StudentViolation, Student, ViolationType } = require('../../models');
            const violation = await StudentViolation.findByPk(id, {
                include: [
                    { model: Student, as: 'student', attributes: ['full_name', 'nis'] },
                    { model: ViolationType, as: 'type', attributes: ['name', 'point'] }
                ],
                attributes: ['id', 'date', 'status']
            });

            if (!violation) {
                return res.json({ success: false, message: 'Document not found' });
            }

            return res.json({
                success: true,
                message: 'Document is verified',
                data: {
                    type: 'Pelanggaran Siswa',
                    document_id: violation.id,
                    student_name: violation.student?.full_name,
                    date: violation.date,
                    status: violation.status
                }
            });
        }

        if (type === 'positive_point') {
            const { StudentPositivePoint, Student, PositivePointType } = require('../../models');
            const positivePoint = await StudentPositivePoint.findByPk(id, {
                include: [
                    { model: Student, as: 'student', attributes: ['full_name', 'nis'] },
                    { model: PositivePointType, as: 'type', attributes: ['name', 'points'] }
                ],
                attributes: ['id', 'date', 'status']
            });

            if (!positivePoint) {
                return res.json({ success: false, message: 'Document not found' });
            }

            return res.json({
                success: true,
                message: 'Document is verified',
                data: {
                    type: 'Poin Positif Siswa',
                    document_id: positivePoint.id,
                    student_name: positivePoint.student?.full_name,
                    date: positivePoint.date,
                    status: positivePoint.status
                }
            });
        }

        return res.status(400).json({ success: false, message: 'Unsupported document type' });
    } catch (error) {
        next(error);
    }
};
