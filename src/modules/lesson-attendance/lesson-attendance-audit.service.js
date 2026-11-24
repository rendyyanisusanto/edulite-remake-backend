const { LessonAttendanceLog } = require('../../models');

const SENSITIVE_KEYS = new Set([
    'pin',
    'attendance_pin',
    'attendance_pin_hash',
    'attendance_token',
    'token',
    'qr_url',
    'password',
    'password_hash',
    'authorization',
    'jwt',
    'access_token',
    'attendance_access_token'
]);

function sanitizeAuditPayload(data) {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) {
        return data.map(sanitizeAuditPayload);
    }
    if (typeof data === 'object') {
        const clean = {};
        for (const [key, value] of Object.entries(data)) {
            if (SENSITIVE_KEYS.has(key.toLowerCase())) {
                clean[key] = '[REDACTED]';
            } else {
                clean[key] = sanitizeAuditPayload(value);
            }
        }
        return clean;
    }
    return data;
}

class LessonAttendanceAuditService {
    async record({
        sessionId = null,
        teacherId = null,
        userId = null,
        action,
        oldData = null,
        newData = null,
        description = null,
        ipAddress = null,
        transaction = null
    }) {
        return LessonAttendanceLog.create({
            session_id: sessionId,
            teacher_id: teacherId,
            user_id: userId,
            action,
            old_data: sanitizeAuditPayload(oldData),
            new_data: sanitizeAuditPayload(newData),
            description,
            ip_address: ipAddress ? String(ipAddress).slice(0, 45) : null
        }, { transaction });
    }
}

module.exports = new LessonAttendanceAuditService();
