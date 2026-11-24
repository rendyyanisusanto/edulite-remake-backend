const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Teacher, Class, User, AcademicYear } = require('../../models');
const {
    ATTENDANCE_TOKEN_EXPIRY_MINUTES,
    ERROR_CODES,
    AppError
} = require('./lesson-attendance.constants');

const ATTENDANCE_PURPOSE = 'LESSON_ATTENDANCE';
const ATTENDANCE_ISSUER = 'edulite-lesson-attendance';
const ATTENDANCE_AUDIENCE = 'lesson-attendance';

function getAttendanceJwtSecret() {
    if (process.env.LESSON_ATTENDANCE_JWT_SECRET) {
        return process.env.LESSON_ATTENDANCE_JWT_SECRET;
    }
    const baseSecret = process.env.JWT_SECRET || 'edulite-dev-fallback-secret';
    return crypto
        .createHmac('sha256', baseSecret)
        .update('lesson-attendance-purpose-key-v1')
        .digest('hex');
}

function computeCredentialFingerprint(pinHash, classToken) {
    return crypto
        .createHash('sha256')
        .update(`${pinHash || ''}:${classToken || ''}`)
        .digest('hex')
        .slice(0, 32);
}

function issueAttendanceToken({ teacherId, classId, academicYearId, pinHash, classToken }) {
    const expiresInSeconds = ATTENDANCE_TOKEN_EXPIRY_MINUTES * 60;
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + expiresInSeconds;

    const payload = {
        purpose: ATTENDANCE_PURPOSE,
        teacher_id: Number(teacherId),
        class_id: Number(classId),
        academic_year_id: Number(academicYearId),
        cred_fp: computeCredentialFingerprint(pinHash, classToken)
    };

    const token = jwt.sign(payload, getAttendanceJwtSecret(), {
        expiresIn: expiresInSeconds,
        issuer: ATTENDANCE_ISSUER,
        audience: ATTENDANCE_AUDIENCE
    });

    return {
        attendance_token: token,
        token_type: 'Bearer',
        expires_in: expiresInSeconds,
        expires_at: new Date(expiresAt * 1000).toISOString()
    };
}

function verifyRawAttendanceToken(token) {
    try {
        const decoded = jwt.verify(token, getAttendanceJwtSecret(), {
            issuer: ATTENDANCE_ISSUER,
            audience: ATTENDANCE_AUDIENCE
        });
        if (!decoded || decoded.purpose !== ATTENDANCE_PURPOSE) {
            throw new AppError('Token presensi tidak valid.', 401, ERROR_CODES.ATTENDANCE_TOKEN_INVALID);
        }
        return decoded;
    } catch (error) {
        if (error instanceof AppError) throw error;
        if (error.name === 'TokenExpiredError') {
            throw new AppError(
                'Sesi presensi telah berakhir. Silakan verifikasi PIN kembali.',
                401,
                ERROR_CODES.ATTENDANCE_TOKEN_EXPIRED
            );
        }
        throw new AppError('Token presensi tidak valid.', 401, ERROR_CODES.ATTENDANCE_TOKEN_INVALID);
    }
}

async function attendanceAccessMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const headerToken = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : (req.headers['x-attendance-token'] || '').trim();

        if (!headerToken) {
            return res.status(401).json({
                success: false,
                message: 'Token akses presensi diperlukan.',
                error_code: ERROR_CODES.ATTENDANCE_TOKEN_INVALID
            });
        }

        const decoded = verifyRawAttendanceToken(headerToken);

        const [teacher, cls, activeAcademicYears] = await Promise.all([
            Teacher.scope('withPinHash').findByPk(decoded.teacher_id, {
                attributes: ['id', 'user_id', 'full_name', 'nip', 'attendance_pin_hash'],
                include: [{ model: User, as: 'user', attributes: ['id', 'is_active'], required: false }]
            }),
            Class.scope('withAttendanceToken').findByPk(decoded.class_id, {
                attributes: ['id', 'name', 'grade_id', 'department_id', 'attendance_token', 'attendance_qr_active']
            }),
            AcademicYear.findAll({ where: { is_active: true }, order: [['id', 'ASC']] })
        ]);

        const activeAcademicYear = activeAcademicYears.length === 1 ? activeAcademicYears[0] : null;

        if (!teacher || (teacher.user && teacher.user.is_active === false) || !teacher.attendance_pin_hash) {
            return res.status(401).json({
                success: false,
                message: 'Sesi presensi guru tidak lagi berlaku. Silakan verifikasi ulang.',
                error_code: ERROR_CODES.ATTENDANCE_TOKEN_INVALID
            });
        }

        if (!cls || !cls.attendance_token || !cls.attendance_qr_active) {
            return res.status(401).json({
                success: false,
                message: 'QR Code kelas tidak aktif atau telah diperbarui.',
                error_code: ERROR_CODES.ATTENDANCE_QR_INACTIVE
            });
        }

        if (!activeAcademicYear || Number(activeAcademicYear.id) !== Number(decoded.academic_year_id)) {
            return res.status(401).json({
                success: false,
                message: 'Tahun ajaran aktif telah berubah. Silakan scan ulang QR kelas.',
                error_code: ERROR_CODES.ATTENDANCE_TOKEN_INVALID
            });
        }

        const expectedFp = computeCredentialFingerprint(teacher.attendance_pin_hash, cls.attendance_token);
        if (decoded.cred_fp !== expectedFp) {
            return res.status(401).json({
                success: false,
                message: 'Kredensial presensi telah diperbarui. Silakan verifikasi PIN kembali.',
                error_code: ERROR_CODES.ATTENDANCE_TOKEN_INVALID
            });
        }

        req.attendanceAuth = {
            teacher: {
                id: teacher.id,
                full_name: teacher.full_name,
                nip: teacher.nip
            },
            classInfo: {
                id: cls.id,
                name: cls.name,
                grade_id: cls.grade_id,
                department_id: cls.department_id
            },
            academicYear: activeAcademicYear
        };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
                error_code: error.errorCode
            });
        }
        next(error);
    }
}

/**
 * Memory-based sliding window rate limiter for single-instance deployments.
 * Limitation: counters reset on process restart and are not shared across multiple backend instances.
 */
class MemorySlidingRateLimiter {
    constructor({ windowMs, maxAttempts }) {
        this.windowMs = windowMs;
        this.maxAttempts = maxAttempts;
        this.store = new Map();
    }

    _prune(key, now) {
        const timestamps = this.store.get(key) || [];
        const valid = timestamps.filter((ts) => now - ts < this.windowMs);
        if (valid.length === 0) {
            this.store.delete(key);
        } else {
            this.store.set(key, valid);
        }
        return valid;
    }

    isLimited(key) {
        const now = Date.now();
        const valid = this._prune(key, now);
        return valid.length >= this.maxAttempts;
    }

    record(key) {
        const now = Date.now();
        const valid = this._prune(key, now);
        valid.push(now);
        this.store.set(key, valid);
    }

    reset(key) {
        this.store.delete(key);
    }
}

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
const resolveQrLimiter = new MemorySlidingRateLimiter({ windowMs: FIFTEEN_MINUTES_MS, maxAttempts: 60 });
const teacherLookupLimiter = new MemorySlidingRateLimiter({ windowMs: FIFTEEN_MINUTES_MS, maxAttempts: 60 });
const pinVerifyPairLimiter = new MemorySlidingRateLimiter({ windowMs: FIFTEEN_MINUTES_MS, maxAttempts: 5 });
const pinVerifyIpLimiter = new MemorySlidingRateLimiter({ windowMs: FIFTEEN_MINUTES_MS, maxAttempts: 25 });
const pinVerifyTeacherLimiter = new MemorySlidingRateLimiter({ windowMs: FIFTEEN_MINUTES_MS, maxAttempts: 15 });

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket?.remoteAddress || 'unknown';
}

function publicReadRateLimit(limiter, prefix) {
    return (req, res, next) => {
        const ip = getClientIp(req);
        const key = `${prefix}:${ip}`;
        if (limiter.isLimited(key)) {
            return res.status(429).json({
                success: false,
                message: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat.',
                error_code: ERROR_CODES.PIN_RATE_LIMITED
            });
        }
        limiter.record(key);
        next();
    };
}

module.exports = {
    issueAttendanceToken,
    attendanceAccessMiddleware,
    computeCredentialFingerprint,
    getClientIp,
    publicReadRateLimit,
    resolveQrLimiter,
    teacherLookupLimiter,
    pinVerifyPairLimiter,
    pinVerifyIpLimiter,
    pinVerifyTeacherLimiter
};
