const Joi = require('joi');
const { ATTENDANCE_STATUSES } = require('./lesson-attendance.constants');

const setPinSchema = Joi.object({
    pin: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.pattern.base': 'PIN presensi harus berupa tepat 6 digit angka.',
            'any.required': 'PIN presensi wajib diisi.'
        })
});

const updateQrStatusSchema = Joi.object({
    is_active: Joi.boolean().required().messages({
        'boolean.base': 'Status aktif harus berupa boolean.',
        'any.required': 'Status aktif wajib diisi.'
    })
});

const verifyPinSchema = Joi.object({
    teacher_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Guru wajib dipilih.',
        'any.required': 'Guru wajib dipilih.'
    }),
    pin: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.pattern.base': 'PIN presensi harus berupa 6 digit angka.',
            'any.required': 'PIN presensi wajib diisi.'
        })
});

const submitAttendanceSchema = Joi.object({
    subject_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Mata pelajaran wajib dipilih.',
        'any.required': 'Mata pelajaran wajib dipilih.'
    }),
    lesson_period_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
        'array.min': 'Pilih minimal satu jam pelajaran.',
        'any.required': 'Jam pelajaran wajib dipilih.'
    }),
    notes: Joi.string().allow('', null).max(1000).optional(),
    students: Joi.array().items(
        Joi.object({
            student_id: Joi.number().integer().positive().required(),
            status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
            notes: Joi.string().allow('', null).max(500).optional()
        })
    ).min(1).required().messages({
        'array.min': 'Daftar presensi siswa tidak boleh kosong.',
        'any.required': 'Daftar presensi siswa wajib diisi.'
    })
});

const manualCreateSchema = Joi.object({
    academic_year_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Tahun ajaran wajib dipilih.'
    }),
    class_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Kelas wajib dipilih.'
    }),
    teacher_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Guru pengajar wajib dipilih.'
    }),
    subject_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Mata pelajaran wajib dipilih.'
    }),
    attendance_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
        'string.pattern.base': 'Format tanggal presensi harus YYYY-MM-DD.',
        'any.required': 'Tanggal presensi wajib diisi.'
    }),
    lesson_period_ids: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
        'array.min': 'Pilih minimal satu jam pelajaran.',
        'any.required': 'Jam pelajaran wajib dipilih.'
    }),
    notes: Joi.string().allow('', null).max(1000).optional(),
    students: Joi.array().items(
        Joi.object({
            student_id: Joi.number().integer().positive().required(),
            status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
            notes: Joi.string().allow('', null).max(500).optional()
        })
    ).min(1).required().messages({
        'array.min': 'Daftar presensi siswa tidak boleh kosong.',
        'any.required': 'Daftar presensi siswa wajib diisi.'
    })
});

const correctSessionSchema = Joi.object({
    teacher_id: Joi.number().integer().positive().optional(),
    subject_id: Joi.number().integer().positive().optional(),
    notes: Joi.string().allow('', null).max(1000).optional(),
    expected_updated_at: Joi.string().allow('', null).optional(),
    reason: Joi.string().trim().min(3).max(1000).required().messages({
        'string.empty': 'Alasan koreksi wajib diisi.',
        'string.min': 'Alasan koreksi minimal 3 karakter.',
        'any.required': 'Alasan koreksi wajib diisi.'
    }),
    students: Joi.array().items(
        Joi.object({
            student_id: Joi.number().integer().positive().required(),
            status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
            notes: Joi.string().allow('', null).max(500).optional()
        })
    ).optional()
});

const reasonSchema = Joi.object({
    reason: Joi.string().trim().min(3).max(1000).required().messages({
        'string.empty': 'Alasan wajib diisi.',
        'string.min': 'Alasan minimal 3 karakter.',
        'any.required': 'Alasan wajib diisi.'
    })
});

function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map((d) => d.message).join(', '),
                error_code: 'VALIDATION_ERROR'
            });
        }
        req.body = value;
        next();
    };
}

module.exports = {
    setPinSchema,
    updateQrStatusSchema,
    verifyPinSchema,
    submitAttendanceSchema,
    manualCreateSchema,
    correctSessionSchema,
    reasonSchema,
    validateBody
};
