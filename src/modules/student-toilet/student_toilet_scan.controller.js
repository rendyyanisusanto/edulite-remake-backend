'use strict';

const scanService = require('./student_toilet_scan.service');
const queryService = require('./student_toilet_query.service');
const { validateToiletScanPayload } = require('./student_toilet.validator');

exports.rfidScan = async (req, res, next) => {
    try {
        validateToiletScanPayload(req.body);

        if (req.body.kiosk_token !== process.env.RFID_TOILET_KIOSK_TOKEN) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }

        const result = await scanService.scan(req.body);
        return res.status(result.statusCode || 200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getCurrentlyOut = async (req, res, next) => {
    try {
        const kioskToken = String(req.query.kiosk_token || '').trim();
        if (!kioskToken || kioskToken !== process.env.RFID_TOILET_KIOSK_TOKEN) {
            return res.status(401).json({ success: false, message: 'Unauthorized kiosk token', code: 'UNAUTHORIZED' });
        }

        const summary = await queryService.getSummary({ date: req.query.date });
        return res.json({
            success: true,
            data: {
                date: summary.date,
                currently_out: summary.currently_out || [],
                currently_out_count: Array.isArray(summary.currently_out) ? summary.currently_out.length : 0,
                total_students_today: Array.isArray(summary.by_student) ? summary.by_student.length : 0,
                total_trips_today: Array.isArray(summary.by_student)
                    ? summary.by_student.reduce((acc, item) => acc + Number(item.total_trips || 0), 0)
                    : 0
            }
        });
    } catch (error) {
        next(error);
    }
};

