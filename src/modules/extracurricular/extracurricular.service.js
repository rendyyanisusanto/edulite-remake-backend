'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const {
    sequelize,
    User,
    Role,
    UserRole,
    Student,
    Class,
    StudentClassHistory,
    Teacher,
    AcademicYear,
    StudentMutation,
    ExtracurricularCategory,
    Extracurricular,
    ExtracurricularCoach,
    ExtracurricularCoachAssignment,
    ExtracurricularSchedule,
    ExtracurricularMember,
    ExtracurricularSession,
    ExtracurricularStudentAttendance,
    ExtracurricularProgressAspect,
    ExtracurricularStudentProgress
} = require('../../models');
const minioSvc = require('../../core/services/minio.service');
const {
    ensure,
    ensureIn,
    allowedValues,
    validateCreateCoachPayload,
    validateUpdateCoachPayload,
    validateCreateMemberPayload,
    validateCreateMembersBulkPayload,
    validateUpdateMemberPayload,
    validateUpdateMemberStatusPayload
} = require('./extracurricular.validator');

const ELEVATED_ROLES = ['SUPERADMIN', 'ADMIN', 'KESISWAAN', 'STAFF_KESISWAAN', 'STAFF KESISWAAN'];
const COACH_PHOTO_FOLDER = 'extracurricular/coaches/photos';

class ExtracurricularService {
    _pagination(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        return { page, limit, offset };
    }

    _meta(count, page, limit) {
        return { totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page };
    }

    _isElevated(user) {
        const roles = user?.roles || [];
        return roles.some(role => ELEVATED_ROLES.includes(role));
    }

    async _getCoachByUserId(userId) {
        return ExtracurricularCoach.findOne({ where: { user_id: userId, is_active: true } });
    }

    async _ensureCoachCanAccessExtracurricular(user, extracurricularId) {
        if (this._isElevated(user)) return true;

        const coach = await this._getCoachByUserId(user.id);
        if (!coach) {
            const err = new Error('Akses ditolak: profil pelatih tidak ditemukan');
            err.statusCode = 403;
            err.errorCode = 'FORBIDDEN';
            throw err;
        }

        const assignment = await ExtracurricularCoachAssignment.findOne({
            where: {
                coach_id: coach.id,
                extracurricular_id: extracurricularId,
                is_active: true
            }
        });

        if (!assignment) {
            const err = new Error('Akses ditolak: pelatih tidak terdaftar pada ekskul ini');
            err.statusCode = 403;
            err.errorCode = 'FORBIDDEN';
            throw err;
        }

        return true;
    }

    async _isStudentInactiveByMutation(studentId) {
        try {
            const latestOutMutation = await StudentMutation.findOne({
                where: {
                    student_id: studentId,
                    mutation_type: 'OUT',
                    status: { [Op.in]: ['APPROVED', 'COMPLETED'] }
                },
                order: [['effective_date', 'DESC'], ['mutation_date', 'DESC']]
            });

            return !!latestOutMutation;
        } catch (_error) {
            return false;
        }
    }

    _normalizeDateTime(value) {
        return value ? new Date(value) : new Date();
    }

    _normalizeDate(value) {
        if (!value) return new Date().toISOString().slice(0, 10);
        return value;
    }

    _isProvided(value) {
        return value !== undefined && value !== null && value !== '';
    }

    _normalizeUsername(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 50);
    }

    async _generateUniqueUsername(baseInput, transaction = null, excludeUserId = null) {
        const base = this._normalizeUsername(baseInput) || 'coach';
        let candidate = base;
        let counter = 1;

        while (true) {
            const where = { username: candidate };
            if (excludeUserId) where.id = { [Op.ne]: excludeUserId };
            const existing = await User.findOne({ where, transaction });
            if (!existing) return candidate;

            const suffix = `_${counter}`;
            candidate = `${base.slice(0, 50 - suffix.length)}${suffix}`;
            counter += 1;
        }
    }

    _canManageMembers(user) {
        return this._isElevated(user);
    }

    _ensureCanManageMembers(user) {
        ensure(
            this._canManageMembers(user),
            'Hanya admin/staff kesiswaan/kesiswaan yang dapat mengelola anggota ekskul'
        );
    }

    async _resolveStudentIdsForUser(user) {
        const roles = user?.roles || [];
        if (!roles.includes('SISWA')) return [];

        if (user.student_id) return [user.student_id];

        const byPk = await Student.findByPk(user.id, { attributes: ['id'] });
        if (byPk) return [byPk.id];

        const byName = await Student.findAll({
            where: { full_name: user.name },
            attributes: ['id'],
            limit: 2
        });
        if (byName.length === 1) return [byName[0].id];

        return [];
    }

    async _getActiveMemberCount(extracurricularId, academicYearId, transaction = null) {
        return ExtracurricularMember.count({
            where: {
                extracurricular_id: extracurricularId,
                academic_year_id: academicYearId,
                status: 'ACTIVE'
            },
            transaction
        });
    }

    async _validateMemberEligibility(extracurricularId, academicYearId, studentId, transaction = null) {
        const extracurricular = await Extracurricular.findByPk(extracurricularId, { transaction });
        ensure(extracurricular, 'Ekskul tidak ditemukan');
        ensure(extracurricular.is_active, 'Ekskul tidak aktif');

        const academicYear = await AcademicYear.findByPk(academicYearId, { transaction });
        ensure(academicYear, 'Tahun ajaran tidak ditemukan');

        const student = await Student.findByPk(studentId, { transaction });
        ensure(student, `Siswa ${studentId} tidak ditemukan`);

        const inactiveByMutation = await this._isStudentInactiveByMutation(studentId);
        ensure(!inactiveByMutation, `Siswa ${student.full_name} nonaktif/mutasi keluar`);

        const duplicate = await ExtracurricularMember.findOne({
            where: {
                extracurricular_id: extracurricularId,
                academic_year_id: academicYearId,
                student_id: studentId
            },
            transaction
        });
        ensure(!duplicate, `Siswa ${student.full_name} sudah menjadi anggota ekskul ini pada tahun ajaran terkait`);

        return { extracurricular, academicYear, student };
    }

    async _findTeacherForInternalCoach(teacherId, transaction = null) {
        const teacher = await Teacher.findByPk(teacherId, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email', 'is_active'],
                    required: false
                }
            ],
            transaction
        });

        ensure(teacher, 'Guru tidak ditemukan');
        ensure(teacher.user_id, 'Guru terpilih belum memiliki akun user');
        return teacher;
    }

    async _ensureUniqueCoachUser(userId, ignoreCoachId = null, transaction = null) {
        const where = { user_id: userId };
        if (ignoreCoachId) where.id = { [Op.ne]: ignoreCoachId };
        const existing = await ExtracurricularCoach.findOne({ where, transaction });
        ensure(!existing, 'Akun user sudah digunakan oleh profil pelatih lain');
    }

    async _ensureUniqueInternalTeacher(teacherId, ignoreCoachId = null, transaction = null) {
        const where = { coach_type: 'INTERNAL', teacher_id: teacherId };
        if (ignoreCoachId) where.id = { [Op.ne]: ignoreCoachId };
        const existing = await ExtracurricularCoach.findOne({ where, transaction });
        ensure(!existing, 'Guru ini sudah terdaftar sebagai pelatih ekskul');
    }

    async _ensureCoachRoleAssigned(userId, transaction) {
        let role = await Role.findOne({
            where: { name: 'PELATIH_EKSKUL' },
            transaction
        });

        if (!role) {
            role = await Role.create(
                { name: 'PELATIH_EKSKUL', description: 'Pelatih ekstrakurikuler internal atau eksternal' },
                { transaction }
            );
        }

        const [mapping] = await UserRole.findOrCreate({
            where: { user_id: userId, role_id: role.id },
            defaults: { user_id: userId, role_id: role.id },
            transaction
        });

        return mapping;
    }

    async getCategories(query = {}) {
        const where = {};
        if (query.search) {
            where.name = { [Op.like]: `%${query.search}%` };
        }

        return ExtracurricularCategory.findAll({ where, order: [['name', 'ASC']] });
    }

    async createCategory(payload) {
        ensure(payload.name, 'Nama kategori wajib diisi');
        return ExtracurricularCategory.create({
            name: payload.name,
            description: payload.description || null
        });
    }

    async updateCategory(id, payload) {
        const item = await ExtracurricularCategory.findByPk(id);
        ensure(item, 'Kategori tidak ditemukan');
        ensure(payload.name, 'Nama kategori wajib diisi');
        return item.update({
            name: payload.name,
            description: payload.description || null
        });
    }

    async getExtracurriculars(query = {}, currentUser = null) {
        const { page, limit, offset } = this._pagination(query);

        const where = {};
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;
        if (query.category_id) where.category_id = query.category_id;
        if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
        if (query.type) where.type = query.type;
        if (query.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${query.search}%` } },
                { code: { [Op.like]: `%${query.search}%` } }
            ];
        }

        if (currentUser && !this._isElevated(currentUser)) {
            const coach = await this._getCoachByUserId(currentUser.id);
            if (coach) {
                const assignments = await ExtracurricularCoachAssignment.findAll({
                    where: { coach_id: coach.id, is_active: true },
                    attributes: ['extracurricular_id']
                });
                const ids = assignments.map(item => item.extracurricular_id);
                where.id = ids.length ? { [Op.in]: ids } : -1;
            }
        }

        const { count, rows } = await Extracurricular.findAndCountAll({
            where,
            include: [
                { model: ExtracurricularCategory, as: 'category', attributes: ['id', 'name'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] },
                { model: User, as: 'creator', attributes: ['id', 'name'] }
            ],
            limit,
            offset,
            order: [[query.sortBy || 'created_at', query.sortDesc === 'true' ? 'DESC' : 'ASC']]
        });

        return { items: rows, ...this._meta(count, page, limit) };
    }

    async getExtracurricularById(id, currentUser = null) {
        const item = await Extracurricular.findByPk(id, {
            include: [
                { model: ExtracurricularCategory, as: 'category', attributes: ['id', 'name'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] }
            ]
        });
        ensure(item, 'Data ekskul tidak ditemukan');

        if (currentUser) {
            await this._ensureCoachCanAccessExtracurricular(currentUser, item.id);
        }

        return item;
    }

    async createExtracurricular(payload, userId) {
        ensure(payload.code, 'Kode ekskul wajib diisi');
        ensure(payload.name, 'Nama ekskul wajib diisi');
        ensure(payload.academic_year_id, 'Tahun ajaran wajib diisi');
        ensureIn(payload.type, allowedValues.extracurricular_type, 'Tipe ekskul');

        return Extracurricular.create({
            ...payload,
            created_by: userId,
            updated_by: userId
        });
    }

    async updateExtracurricular(id, payload, userId) {
        const item = await Extracurricular.findByPk(id);
        ensure(item, 'Data ekskul tidak ditemukan');
        if (payload.type) ensureIn(payload.type, allowedValues.extracurricular_type, 'Tipe ekskul');

        return item.update({
            ...payload,
            updated_by: userId
        });
    }

    async toggleExtracurricularActive(id, userId) {
        const item = await Extracurricular.findByPk(id);
        ensure(item, 'Data ekskul tidak ditemukan');
        return item.update({ is_active: !item.is_active, updated_by: userId });
    }

    async getCoaches(query = {}) {
        const { page, limit, offset } = this._pagination(query);
        const where = {};
        if (query.coach_type) where.coach_type = query.coach_type;
        if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
        if (query.search) {
            where[Op.or] = [
                { full_name: { [Op.like]: `%${query.search}%` } },
                { phone: { [Op.like]: `%${query.search}%` } },
                { email: { [Op.like]: `%${query.search}%` } },
                { '$user.name$': { [Op.like]: `%${query.search}%` } },
                { '$user.email$': { [Op.like]: `%${query.search}%` } },
                { '$teacher.full_name$': { [Op.like]: `%${query.search}%` } }
            ];
        }

        const include = [
            { model: User, as: 'user', attributes: ['id', 'name', 'email', 'is_active'] },
            { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip'], required: false }
        ];

        if (query.extracurricular_id) {
            include.push({
                model: ExtracurricularCoachAssignment,
                as: 'assignments',
                attributes: [],
                required: true,
                where: {
                    extracurricular_id: query.extracurricular_id,
                    ...(query.assignment_is_active !== undefined ? { is_active: query.assignment_is_active === 'true' } : {})
                }
            });
        }

        const { count, rows } = await ExtracurricularCoach.findAndCountAll({
            where,
            include,
            limit,
            offset,
            order: [['created_at', 'DESC']],
            distinct: true,
            subQuery: false
        });

        return { items: rows, ...this._meta(count, page, limit) };
    }

    async getCoachById(id) {
        const item = await ExtracurricularCoach.findByPk(id, {
            include: [
                { model: User, as: 'user', attributes: ['id', 'name', 'email', 'is_active'] },
                { model: Teacher, as: 'teacher', attributes: ['id', 'full_name', 'nip'], required: false }
            ]
        });
        ensure(item, 'Data pelatih tidak ditemukan');
        return item;
    }

    async createInternalCoach(payload, authUser) {
        validateCreateCoachPayload(payload);

        const coach = await sequelize.transaction(async (transaction) => {
            const teacher = await this._findTeacherForInternalCoach(payload.teacher_id, transaction);

            await this._ensureUniqueInternalTeacher(teacher.id, null, transaction);
            await this._ensureUniqueCoachUser(teacher.user_id, null, transaction);

            return ExtracurricularCoach.create({
                user_id: teacher.user_id,
                teacher_id: teacher.id,
                coach_type: 'INTERNAL',
                full_name: teacher.full_name,
                gender: this._isProvided(payload.gender) ? payload.gender : teacher.gender,
                phone: this._isProvided(payload.phone) ? payload.phone : teacher.phone,
                email: teacher.user?.email || null,
                address: payload.address || null,
                expertise: payload.expertise || null,
                photo: payload.photo || null,
                is_active: payload.is_active !== undefined ? !!payload.is_active : true,
                created_by: authUser.id,
                updated_by: authUser.id
            }, { transaction });
        });

        return this.getCoachById(coach.id);
    }

    async createExternalCoach(payload, authUser) {
        validateCreateCoachPayload(payload);

        const coach = await sequelize.transaction(async (transaction) => {
            let user = null;
            const incomingUserId = payload.external_user_id || payload.user_id || null;

            if (incomingUserId) {
                user = await User.findByPk(incomingUserId, { transaction });
                ensure(user, 'User eksternal tidak ditemukan');

                const teacherByUser = await Teacher.findOne({
                    where: { user_id: user.id },
                    transaction
                });
                ensure(!teacherByUser, 'User yang dipilih terhubung ke data guru. Pilih user non-guru untuk pelatih EXTERNAL');
            } else {
                const existingEmail = await User.findOne({
                    where: { email: payload.email },
                    transaction
                });
                ensure(!existingEmail, 'Email user eksternal sudah digunakan');

                const passwordHash = await bcrypt.hash(payload.password, 10);
                const username = await this._generateUniqueUsername(payload.email.split('@')[0] || payload.full_name, transaction);
                user = await User.create({
                    name: payload.full_name,
                    username,
                    email: payload.email,
                    password_hash: passwordHash,
                    is_active: payload.is_active !== undefined ? !!payload.is_active : true
                }, { transaction });
            }

            await this._ensureUniqueCoachUser(user.id, null, transaction);
            await this._ensureCoachRoleAssigned(user.id, transaction);

            return ExtracurricularCoach.create({
                user_id: user.id,
                teacher_id: null,
                coach_type: 'EXTERNAL',
                full_name: payload.full_name || user.name,
                gender: payload.gender || null,
                phone: payload.phone || null,
                email: payload.email || user.email,
                address: payload.address || null,
                expertise: payload.expertise || null,
                photo: payload.photo || null,
                is_active: payload.is_active !== undefined ? !!payload.is_active : true,
                created_by: authUser.id,
                updated_by: authUser.id
            }, { transaction });
        });

        return this.getCoachById(coach.id);
    }

    async createCoach(payload, authUser) {
        ensure(payload.coach_type, 'Tipe pelatih wajib diisi');
        ensureIn(payload.coach_type, allowedValues.coach_type, 'Tipe pelatih');

        if (payload.coach_type === 'INTERNAL') {
            return this.createInternalCoach(payload, authUser);
        }
        return this.createExternalCoach(payload, authUser);
    }

    async updateInternalCoach(id, payload, authUser) {
        const coach = await sequelize.transaction(async (transaction) => {
            const item = await ExtracurricularCoach.findByPk(id, { transaction });
            ensure(item, 'Data pelatih tidak ditemukan');
            ensure(item.coach_type === 'INTERNAL', 'Data pelatih ini bukan tipe INTERNAL');

            validateUpdateCoachPayload(payload, item.coach_type);

            const teacherId = payload.teacher_id || item.teacher_id;
            ensure(teacherId, 'Teacher wajib dipilih untuk pelatih INTERNAL');

            const teacher = await this._findTeacherForInternalCoach(teacherId, transaction);
            await this._ensureUniqueInternalTeacher(teacher.id, item.id, transaction);
            await this._ensureUniqueCoachUser(teacher.user_id, item.id, transaction);

            await item.update({
                user_id: teacher.user_id,
                teacher_id: teacher.id,
                coach_type: 'INTERNAL',
                full_name: teacher.full_name,
                gender: this._isProvided(payload.gender) ? payload.gender : item.gender,
                phone: this._isProvided(payload.phone) ? payload.phone : item.phone,
                email: teacher.user?.email || null,
                address: this._isProvided(payload.address) ? payload.address : item.address,
                expertise: this._isProvided(payload.expertise) ? payload.expertise : item.expertise,
                photo: this._isProvided(payload.photo) ? payload.photo : item.photo,
                is_active: payload.is_active !== undefined ? !!payload.is_active : item.is_active,
                updated_by: authUser.id
            }, { transaction });

            return item;
        });

        return this.getCoachById(coach.id);
    }

    async updateExternalCoach(id, payload, authUser) {
        const coach = await sequelize.transaction(async (transaction) => {
            const item = await ExtracurricularCoach.findByPk(id, { transaction });
            ensure(item, 'Data pelatih tidak ditemukan');
            ensure(item.coach_type === 'EXTERNAL', 'Data pelatih ini bukan tipe EXTERNAL');

            validateUpdateCoachPayload(payload, item.coach_type);

            const user = await User.findByPk(item.user_id, { transaction });
            ensure(user, 'Akun user pelatih tidak ditemukan');

            const userUpdates = {};
            if (this._isProvided(payload.full_name)) userUpdates.name = payload.full_name;
            if (this._isProvided(payload.email)) {
                const existingEmail = await User.findOne({
                    where: {
                        email: payload.email,
                        id: { [Op.ne]: user.id }
                    },
                    transaction
                });
                ensure(!existingEmail, 'Email user eksternal sudah digunakan');
                userUpdates.email = payload.email;
            }
            if (this._isProvided(payload.password)) {
                userUpdates.password_hash = await bcrypt.hash(payload.password, 10);
            }
            if (payload.is_active !== undefined) {
                userUpdates.is_active = !!payload.is_active;
            }

            if (Object.keys(userUpdates).length > 0) {
                await user.update(userUpdates, { transaction });
            }

            await this._ensureCoachRoleAssigned(user.id, transaction);
            await this._ensureUniqueCoachUser(user.id, item.id, transaction);

            await item.update({
                coach_type: 'EXTERNAL',
                teacher_id: null,
                user_id: user.id,
                full_name: this._isProvided(payload.full_name) ? payload.full_name : item.full_name,
                gender: this._isProvided(payload.gender) ? payload.gender : item.gender,
                phone: this._isProvided(payload.phone) ? payload.phone : item.phone,
                email: this._isProvided(payload.email) ? payload.email : user.email,
                address: this._isProvided(payload.address) ? payload.address : item.address,
                expertise: this._isProvided(payload.expertise) ? payload.expertise : item.expertise,
                photo: this._isProvided(payload.photo) ? payload.photo : item.photo,
                is_active: payload.is_active !== undefined ? !!payload.is_active : item.is_active,
                updated_by: authUser.id
            }, { transaction });

            return item;
        });

        return this.getCoachById(coach.id);
    }

    async updateCoach(id, payload, authUser) {
        const item = await ExtracurricularCoach.findByPk(id);
        ensure(item, 'Data pelatih tidak ditemukan');

        validateUpdateCoachPayload(payload, item.coach_type);

        const targetType = payload.coach_type || item.coach_type;
        if (targetType === 'INTERNAL') {
            return this.updateInternalCoach(id, payload, authUser);
        }
        return this.updateExternalCoach(id, payload, authUser);
    }

    async toggleCoachActive(id, userId) {
        const item = await ExtracurricularCoach.findByPk(id);
        ensure(item, 'Data pelatih tidak ditemukan');
        return item.update({ is_active: !item.is_active, updated_by: userId });
    }

    async deleteCoach(id) {
        const item = await ExtracurricularCoach.findByPk(id);
        ensure(item, 'Data pelatih tidak ditemukan');
        await item.destroy();
        return true;
    }

    async uploadCoachPhoto(id, file, userId) {
        const item = await ExtracurricularCoach.findByPk(id);
        ensure(item, 'Data pelatih tidak ditemukan');
        ensure(file, 'File foto tidak ditemukan');

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            const err = new Error('Hanya file JPEG, PNG, dan WebP yang diperbolehkan');
            err.statusCode = 400;
            err.errorCode = 'VALIDATION_ERROR';
            throw err;
        }

        if (file.size > 2 * 1024 * 1024) {
            const err = new Error('Ukuran file maksimal 2 MB');
            err.statusCode = 400;
            err.errorCode = 'VALIDATION_ERROR';
            throw err;
        }

        const publicUrl = await minioSvc.uploadFile(
            COACH_PHOTO_FOLDER,
            file.originalname,
            file.buffer,
            file.mimetype
        );

        if (item.photo) {
            await minioSvc.deleteFile(item.photo);
        }

        await item.update({
            photo: publicUrl,
            updated_by: userId
        });

        return { url: publicUrl };
    }

    async getAssignments(query = {}, currentUser = null) {
        const { page, limit, offset } = this._pagination(query);

        const where = {};
        if (query.extracurricular_id) where.extracurricular_id = query.extracurricular_id;
        if (query.coach_id) where.coach_id = query.coach_id;
        if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

        if (currentUser && !this._isElevated(currentUser)) {
            const coach = await this._getCoachByUserId(currentUser.id);
            where.coach_id = coach?.id || -1;
        }

        const { count, rows } = await ExtracurricularCoachAssignment.findAndCountAll({
            where,
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'code', 'name'] },
                { model: ExtracurricularCoach, as: 'coach', attributes: ['id', 'full_name', 'coach_type', 'is_active'] }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return { items: rows, ...this._meta(count, page, limit) };
    }

    async createAssignment(payload, userId) {
        ensure(payload.extracurricular_id, 'Ekskul wajib diisi');
        ensure(payload.coach_id, 'Pelatih wajib diisi');
        ensureIn(payload.role, allowedValues.assignment_role, 'Role assignment');

        const existing = await ExtracurricularCoachAssignment.findOne({
            where: {
                extracurricular_id: payload.extracurricular_id,
                coach_id: payload.coach_id,
                is_active: true
            }
        });
        ensure(!existing, 'Assignment aktif untuk pelatih ini sudah ada');

        return ExtracurricularCoachAssignment.create({
            ...payload,
            created_by: userId,
            updated_by: userId
        });
    }

    async updateAssignment(id, payload, userId) {
        const item = await ExtracurricularCoachAssignment.findByPk(id);
        ensure(item, 'Data assignment tidak ditemukan');
        if (payload.role) ensureIn(payload.role, allowedValues.assignment_role, 'Role assignment');

        if (payload.is_active === true || (payload.is_active === undefined && item.is_active)) {
            const extracurricularId = payload.extracurricular_id || item.extracurricular_id;
            const coachId = payload.coach_id || item.coach_id;
            const existing = await ExtracurricularCoachAssignment.findOne({
                where: {
                    id: { [Op.ne]: item.id },
                    extracurricular_id: extracurricularId,
                    coach_id: coachId,
                    is_active: true
                }
            });
            ensure(!existing, 'Assignment aktif duplikat terdeteksi');
        }

        return item.update({ ...payload, updated_by: userId });
    }

    async toggleAssignmentActive(id, userId) {
        const item = await ExtracurricularCoachAssignment.findByPk(id);
        ensure(item, 'Data assignment tidak ditemukan');

        if (!item.is_active) {
            const existing = await ExtracurricularCoachAssignment.findOne({
                where: {
                    id: { [Op.ne]: item.id },
                    extracurricular_id: item.extracurricular_id,
                    coach_id: item.coach_id,
                    is_active: true
                }
            });
            ensure(!existing, 'Tidak dapat mengaktifkan karena assignment aktif sudah ada');
        }

        return item.update({ is_active: !item.is_active, updated_by: userId });
    }

    async deleteAssignment(id) {
        const item = await ExtracurricularCoachAssignment.findByPk(id);
        ensure(item, 'Data assignment tidak ditemukan');
        await item.destroy();
        return true;
    }

    async getSchedules(query = {}, currentUser = null) {
        const where = {};
        if (query.extracurricular_id) where.extracurricular_id = query.extracurricular_id;
        if (query.day_of_week) where.day_of_week = query.day_of_week;
        if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

        if (currentUser && query.extracurricular_id) {
            await this._ensureCoachCanAccessExtracurricular(currentUser, parseInt(query.extracurricular_id, 10));
        }

        return ExtracurricularSchedule.findAll({
            where,
            include: [{ model: Extracurricular, as: 'extracurricular', attributes: ['id', 'code', 'name'] }],
            order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
        });
    }

    async getSchedulesByExtracurricular(extracurricularId, currentUser = null) {
        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, parseInt(extracurricularId, 10));
        return ExtracurricularSchedule.findAll({
            where: { extracurricular_id: extracurricularId },
            order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
        });
    }

    async createSchedule(payload, currentUser) {
        ensure(payload.extracurricular_id, 'Ekskul wajib diisi');
        ensure(payload.day_of_week, 'Hari wajib diisi');
        ensure(payload.start_time, 'Jam mulai wajib diisi');
        ensure(payload.end_time, 'Jam selesai wajib diisi');

        await this._ensureCoachCanAccessExtracurricular(currentUser, payload.extracurricular_id);
        return ExtracurricularSchedule.create(payload);
    }

    async updateSchedule(id, payload, currentUser) {
        const item = await ExtracurricularSchedule.findByPk(id);
        ensure(item, 'Jadwal tidak ditemukan');

        const extracurricularId = payload.extracurricular_id || item.extracurricular_id;
        await this._ensureCoachCanAccessExtracurricular(currentUser, extracurricularId);

        return item.update(payload);
    }

    async getRegistrations(query = {}, currentUser = null) {
        const err = new Error('Flow registration ekskul sudah deprecated. Gunakan endpoint anggota ekskul.');
        err.statusCode = 410;
        err.errorCode = 'FEATURE_DEPRECATED';
        throw err;
    }

    async createRegistration(payload, user) {
        const err = new Error('Flow registration ekskul sudah deprecated. Gunakan endpoint anggota ekskul.');
        err.statusCode = 410;
        err.errorCode = 'FEATURE_DEPRECATED';
        throw err;
    }

    async approveRegistration(id, user, payload = {}) {
        const err = new Error('Flow registration ekskul sudah deprecated. Gunakan endpoint anggota ekskul.');
        err.statusCode = 410;
        err.errorCode = 'FEATURE_DEPRECATED';
        throw err;
    }

    async rejectRegistration(id, user, payload = {}) {
        const err = new Error('Flow registration ekskul sudah deprecated. Gunakan endpoint anggota ekskul.');
        err.statusCode = 410;
        err.errorCode = 'FEATURE_DEPRECATED';
        throw err;
    }

    async cancelRegistration(id, user, payload = {}) {
        const err = new Error('Flow registration ekskul sudah deprecated. Gunakan endpoint anggota ekskul.');
        err.statusCode = 410;
        err.errorCode = 'FEATURE_DEPRECATED';
        throw err;
    }

    async getMembers(query = {}, currentUser = null) {
        const { page, limit, offset } = this._pagination(query);

        const where = {};
        if (query.extracurricular_id) where.extracurricular_id = query.extracurricular_id;
        if (query.student_id) where.student_id = query.student_id;
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;
        if (query.status) where.status = query.status;

        if (currentUser && !this._isElevated(currentUser)) {
            const coach = await this._getCoachByUserId(currentUser.id);
            if (coach) {
                const assignments = await ExtracurricularCoachAssignment.findAll({
                    where: { coach_id: coach.id, is_active: true },
                    attributes: ['extracurricular_id']
                });
                const ids = assignments.map(item => item.extracurricular_id);
                where.extracurricular_id = ids.length ? { [Op.in]: ids } : -1;
            } else if ((currentUser.roles || []).includes('SISWA')) {
                const studentIds = await this._resolveStudentIdsForUser(currentUser);
                where.student_id = studentIds.length ? { [Op.in]: studentIds } : -1;
            }
        }

        const { count, rows } = await ExtracurricularMember.findAndCountAll({
            where,
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'code', 'name'] },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'nisn'] },
                { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] }
            ],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return { items: rows, ...this._meta(count, page, limit) };
    }

    async getMembersByExtracurricular(extracurricularId, query = {}, currentUser = null) {
        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, extracurricularId);
        return this.getMembers({ ...query, extracurricular_id: extracurricularId }, currentUser);
    }

    async createMember(payload, authUser) {
        this._ensureCanManageMembers(authUser);
        validateCreateMemberPayload(payload);
        validateUpdateMemberPayload(payload);

        return sequelize.transaction(async (transaction) => {
            const { extracurricular } = await this._validateMemberEligibility(
                payload.extracurricular_id,
                payload.academic_year_id,
                payload.student_id,
                transaction
            );

            if (extracurricular.max_members) {
                const activeCount = await this._getActiveMemberCount(
                    payload.extracurricular_id,
                    payload.academic_year_id,
                    transaction
                );
                ensure(activeCount < extracurricular.max_members, 'Kuota anggota ekskul sudah penuh');
            }

            const member = await ExtracurricularMember.create({
                extracurricular_id: payload.extracurricular_id,
                student_id: payload.student_id,
                academic_year_id: payload.academic_year_id,
                join_date: payload.join_date,
                exit_date: payload.exit_date || null,
                member_no: payload.member_no || null,
                status: payload.status || 'ACTIVE',
                notes: payload.notes || null,
                created_by: authUser.id,
                updated_by: authUser.id
            }, { transaction });

            return ExtracurricularMember.findByPk(member.id, {
                transaction,
                include: [
                    { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'code', 'name'] },
                    { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'nisn'] },
                    { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'] }
                ]
            });
        });
    }

    async createMembersBulk(payload, authUser) {
        this._ensureCanManageMembers(authUser);
        validateCreateMembersBulkPayload(payload);

        const normalizedStudentIds = [...new Set(payload.student_ids.map(item => parseInt(item, 10)).filter(Number.isInteger))];
        ensure(normalizedStudentIds.length > 0, 'Semua student_ids harus berupa integer valid');

        return sequelize.transaction(async (transaction) => {
            const extracurricular = await Extracurricular.findByPk(payload.extracurricular_id, { transaction });
            ensure(extracurricular, 'Ekskul tidak ditemukan');
            ensure(extracurricular.is_active, 'Ekskul tidak aktif');

            const academicYear = await AcademicYear.findByPk(payload.academic_year_id, { transaction });
            ensure(academicYear, 'Tahun ajaran tidak ditemukan');

            const existingMembers = await ExtracurricularMember.findAll({
                where: {
                    extracurricular_id: payload.extracurricular_id,
                    academic_year_id: payload.academic_year_id,
                    student_id: { [Op.in]: normalizedStudentIds }
                },
                transaction
            });
            const existingStudentIdSet = new Set(existingMembers.map(item => item.student_id));

            let remainingQuota = null;
            if (extracurricular.max_members) {
                const activeCount = await this._getActiveMemberCount(payload.extracurricular_id, payload.academic_year_id, transaction);
                remainingQuota = extracurricular.max_members - activeCount;
                ensure(remainingQuota > 0, 'Kuota anggota ekskul sudah penuh');
            }

            const created = [];
            const skippedStudents = [];
            const failedStudents = [];

            for (const studentId of normalizedStudentIds) {
                const student = await Student.findByPk(studentId, { transaction });
                if (!student) {
                    failedStudents.push({ student_id: studentId, reason: 'Siswa tidak ditemukan' });
                    continue;
                }

                if (existingStudentIdSet.has(studentId)) {
                    skippedStudents.push({
                        student_id: studentId,
                        student_name: student.full_name,
                        reason: 'Sudah terdaftar pada ekskul ini di tahun ajaran yang sama'
                    });
                    continue;
                }

                const inactiveByMutation = await this._isStudentInactiveByMutation(studentId);
                if (inactiveByMutation) {
                    failedStudents.push({
                        student_id: studentId,
                        student_name: student.full_name,
                        reason: 'Siswa nonaktif/mutasi keluar'
                    });
                    continue;
                }

                if (remainingQuota !== null && remainingQuota <= 0) {
                    failedStudents.push({
                        student_id: studentId,
                        student_name: student.full_name,
                        reason: 'Kuota ekskul sudah penuh'
                    });
                    continue;
                }

                const member = await ExtracurricularMember.create({
                    extracurricular_id: payload.extracurricular_id,
                    student_id: studentId,
                    academic_year_id: payload.academic_year_id,
                    join_date: payload.join_date,
                    member_no: payload.member_no || null,
                    status: 'ACTIVE',
                    notes: payload.notes || null,
                    created_by: authUser.id,
                    updated_by: authUser.id
                }, { transaction });

                created.push(member);
                if (remainingQuota !== null) remainingQuota -= 1;
            }

            return {
                extracurricular_id: payload.extracurricular_id,
                academic_year_id: payload.academic_year_id,
                total_requested: normalizedStudentIds.length,
                total_created: created.length,
                skipped_students: skippedStudents,
                failed_students: failedStudents
            };
        });
    }

    async getAssignedStudents(extracurricularId, query = {}, currentUser = null) {
        const parsedId = parseInt(extracurricularId, 10);
        ensure(parsedId, 'ID ekskul tidak valid');
        ensure(query.academic_year_id, 'academic_year_id wajib diisi');

        if (currentUser && !this._isElevated(currentUser)) {
            await this._ensureCoachCanAccessExtracurricular(currentUser, parsedId);
        }

        const where = {
            extracurricular_id: parsedId,
            academic_year_id: query.academic_year_id
        };
        if (query.status) where.status = query.status;
        if (!query.status) where.status = 'ACTIVE';

        const studentWhere = {};
        if (query.keyword) {
            studentWhere[Op.or] = [
                { full_name: { [Op.like]: `%${query.keyword}%` } },
                { nis: { [Op.like]: `%${query.keyword}%` } },
                { nisn: { [Op.like]: `%${query.keyword}%` } }
            ];
        }

        const requestedLimit = parseInt(query.limit, 10);
        const limit = Number.isNaN(requestedLimit) || requestedLimit <= 0
            ? 200
            : Math.min(requestedLimit, 500);

        return ExtracurricularMember.findAll({
            where,
            include: [
                {
                    model: Student,
                    as: 'student',
                    where: studentWhere,
                    attributes: ['id', 'full_name', 'nis', 'nisn', 'gender', 'photo']
                },
                {
                    model: AcademicYear,
                    as: 'academic_year',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            limit,
            order: [[{ model: Student, as: 'student' }, 'full_name', 'ASC']]
        });
    }

    async getAvailableStudents(extracurricularId, query = {}, currentUser = null) {
        const parsedId = parseInt(extracurricularId, 10);
        ensure(parsedId, 'ID ekskul tidak valid');
        ensure(query.academic_year_id, 'academic_year_id wajib diisi');

        if (currentUser && !this._isElevated(currentUser)) {
            await this._ensureCoachCanAccessExtracurricular(currentUser, parsedId);
        }

        const activeMemberRows = await ExtracurricularMember.findAll({
            where: {
                extracurricular_id: parsedId,
                academic_year_id: query.academic_year_id,
                status: 'ACTIVE'
            },
            attributes: ['student_id']
        });
        const excludedStudentIds = activeMemberRows.map(item => item.student_id);

        let inactiveStudentIds = [];
        try {
            const outMutations = await StudentMutation.findAll({
                where: {
                    mutation_type: 'OUT',
                    status: { [Op.in]: ['APPROVED', 'COMPLETED'] }
                },
                attributes: ['student_id']
            });
            inactiveStudentIds = outMutations.map(item => item.student_id);
        } catch (_error) {
            inactiveStudentIds = [];
        }
        const blockedStudentIds = [...new Set([...excludedStudentIds, ...inactiveStudentIds])];

        const whereStudent = {};
        if (blockedStudentIds.length > 0) {
            whereStudent.id = { [Op.notIn]: blockedStudentIds };
        }
        if (query.keyword) {
            whereStudent[Op.or] = [
                { full_name: { [Op.like]: `%${query.keyword}%` } },
                { nis: { [Op.like]: `%${query.keyword}%` } },
                { nisn: { [Op.like]: `%${query.keyword}%` } }
            ];
        }

        const requestedLimit = parseInt(query.limit, 10);
        const defaultLimit = query.class_id ? 200 : 80;
        const limit = Number.isNaN(requestedLimit) || requestedLimit <= 0
            ? defaultLimit
            : Math.min(requestedLimit, 500);

        const classHistoryInclude = {
            model: StudentClassHistory,
            as: 'class_history',
            required: false,
            where: { academic_year_id: query.academic_year_id },
            include: [
                { model: Class, as: 'class_info', attributes: ['id', 'name'], required: false }
            ]
        };
        if (query.class_id) {
            classHistoryInclude.required = true;
            classHistoryInclude.where.class_id = query.class_id;
        }

        const students = await Student.findAll({
            where: whereStudent,
            attributes: ['id', 'full_name', 'nis', 'nisn', 'gender', 'photo'],
            include: [classHistoryInclude],
            limit,
            order: [['full_name', 'ASC']]
        });

        return students
            .filter(student => !blockedStudentIds.includes(student.id))
            .map(student => ({
                ...student.toJSON(),
                current_class: (student.class_history || [])[0]?.class_info || null
            }));
    }

    async updateMember(id, payload, authUser) {
        this._ensureCanManageMembers(authUser);
        const member = await ExtracurricularMember.findByPk(id);
        ensure(member, 'Data anggota tidak ditemukan');
        validateUpdateMemberPayload(payload);

        if (payload.extracurricular_id || payload.student_id || payload.academic_year_id) {
            const existing = await ExtracurricularMember.findOne({
                where: {
                    id: { [Op.ne]: id },
                    extracurricular_id: payload.extracurricular_id || member.extracurricular_id,
                    student_id: payload.student_id || member.student_id,
                    academic_year_id: payload.academic_year_id || member.academic_year_id
                }
            });
            ensure(!existing, 'Duplikasi anggota ekskul di tahun ajaran yang sama');
        }

        return member.update({ ...payload, updated_by: authUser.id });
    }

    async updateMemberStatus(id, payload, authUser) {
        validateUpdateMemberStatusPayload(payload);
        return this.updateMember(id, payload, authUser);
    }

    async deleteMember(id, authUser) {
        this._ensureCanManageMembers(authUser);
        const member = await ExtracurricularMember.findByPk(id);
        ensure(member, 'Data anggota tidak ditemukan');
        await member.destroy();
        return true;
    }

    async getSessions(query = {}, currentUser = null) {
        const { page, limit, offset } = this._pagination(query);

        const where = {};
        if (query.extracurricular_id) where.extracurricular_id = query.extracurricular_id;
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;
        if (query.schedule_id) where.schedule_id = query.schedule_id;
        if (query.status) where.status = query.status;
        if (query.date_from || query.date_to) {
            where.session_date = {};
            if (query.date_from) where.session_date[Op.gte] = query.date_from;
            if (query.date_to) where.session_date[Op.lte] = query.date_to;
        }

        if (currentUser && !this._isElevated(currentUser)) {
            const coach = await this._getCoachByUserId(currentUser.id);
            if (coach) {
                const assignments = await ExtracurricularCoachAssignment.findAll({
                    where: { coach_id: coach.id, is_active: true },
                    attributes: ['id', 'extracurricular_id']
                });
                const extraIds = assignments.map(item => item.extracurricular_id);
                where.extracurricular_id = extraIds.length ? { [Op.in]: extraIds } : -1;
            } else if ((currentUser.roles || []).includes('SISWA')) {
                const studentIds = await this._resolveStudentIdsForUser(currentUser);
                const myMembers = await ExtracurricularMember.findAll({
                    where: {
                        student_id: studentIds.length ? { [Op.in]: studentIds } : -1,
                        status: 'ACTIVE'
                    },
                    attributes: ['extracurricular_id']
                });
                const extraIds = [...new Set(myMembers.map(item => item.extracurricular_id))];
                where.extracurricular_id = extraIds.length ? { [Op.in]: extraIds } : -1;
            }
        }

        const { count, rows } = await ExtracurricularSession.findAndCountAll({
            where,
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'code', 'name'] },
                { model: ExtracurricularSchedule, as: 'schedule', attributes: ['id', 'title', 'day_of_week', 'start_time', 'end_time'], required: false },
                {
                    model: ExtracurricularCoachAssignment,
                    as: 'coach_assignment',
                    required: false,
                    include: [{ model: ExtracurricularCoach, as: 'coach', attributes: ['id', 'full_name'] }]
                }
            ],
            limit,
            offset,
            order: [['session_date', 'DESC'], ['start_time', 'ASC']]
        });

        return { items: rows, ...this._meta(count, page, limit) };
    }

    async getSessionById(id, currentUser = null) {
        const item = await ExtracurricularSession.findByPk(id, {
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'code', 'name'] },
                { model: ExtracurricularSchedule, as: 'schedule', required: false },
                {
                    model: ExtracurricularCoachAssignment,
                    as: 'coach_assignment',
                    required: false,
                    include: [{ model: ExtracurricularCoach, as: 'coach', attributes: ['id', 'full_name'] }]
                }
            ]
        });
        ensure(item, 'Sesi ekskul tidak ditemukan');
        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, item.extracurricular_id);
        return item;
    }

    async createSession(payload, user) {
        ensure(payload.extracurricular_id, 'Ekskul wajib diisi');
        ensure(payload.academic_year_id, 'Tahun ajaran wajib diisi');
        ensure(payload.session_date, 'Tanggal sesi wajib diisi');
        ensureIn(payload.status || 'DRAFT', allowedValues.session_status, 'Status sesi');

        await this._ensureCoachCanAccessExtracurricular(user, payload.extracurricular_id);

        if (payload.coach_assignment_id) {
            const assignment = await ExtracurricularCoachAssignment.findByPk(payload.coach_assignment_id);
            ensure(assignment && assignment.extracurricular_id === payload.extracurricular_id, 'Coach assignment tidak valid');
        }

        return ExtracurricularSession.create({
            ...payload,
            status: payload.status || 'DRAFT',
            created_by: user.id,
            updated_by: user.id
        });
    }

    async updateSession(id, payload, user) {
        const item = await ExtracurricularSession.findByPk(id);
        ensure(item, 'Sesi ekskul tidak ditemukan');
        await this._ensureCoachCanAccessExtracurricular(user, item.extracurricular_id);

        if (item.status === 'CLOSED' && !this._isElevated(user)) {
            const err = new Error('Sesi CLOSED tidak dapat diubah oleh pelatih');
            err.statusCode = 403;
            err.errorCode = 'FORBIDDEN';
            throw err;
        }

        if (payload.status) ensureIn(payload.status, allowedValues.session_status, 'Status sesi');

        return item.update({ ...payload, updated_by: user.id });
    }

    async openSession(id, user) {
        const item = await ExtracurricularSession.findByPk(id);
        ensure(item, 'Sesi ekskul tidak ditemukan');
        await this._ensureCoachCanAccessExtracurricular(user, item.extracurricular_id);

        ensure(item.status !== 'CLOSED', 'Sesi yang sudah CLOSED tidak dapat dibuka ulang');

        return item.update({ status: 'OPEN', updated_by: user.id });
    }

    async closeSession(id, user) {
        const item = await ExtracurricularSession.findByPk(id);
        ensure(item, 'Sesi ekskul tidak ditemukan');
        await this._ensureCoachCanAccessExtracurricular(user, item.extracurricular_id);

        return item.update({ status: 'CLOSED', updated_by: user.id, actual_end_at: item.actual_end_at || new Date() });
    }

    async cancelSession(id, user, payload = {}) {
        const item = await ExtracurricularSession.findByPk(id);
        ensure(item, 'Sesi ekskul tidak ditemukan');
        await this._ensureCoachCanAccessExtracurricular(user, item.extracurricular_id);

        return item.update({ status: 'CANCELLED', notes: payload.notes ?? item.notes, updated_by: user.id });
    }

    async coachCheckIn(sessionId, user, payload = {}) {
        const session = await ExtracurricularSession.findByPk(sessionId);
        ensure(session, 'Sesi ekskul tidak ditemukan');
        await this._ensureCoachCanAccessExtracurricular(user, session.extracurricular_id);

        ensureIn(payload.coach_attendance_status || 'PRESENT', allowedValues.coach_attendance_status, 'Status presensi pelatih');

        return session.update({
            coach_attendance_status: payload.coach_attendance_status || 'PRESENT',
            coach_checkin_at: new Date(),
            coach_note: payload.coach_note || session.coach_note,
            actual_start_at: session.actual_start_at || new Date(),
            status: session.status === 'DRAFT' ? 'OPEN' : session.status,
            updated_by: user.id
        });
    }

    async coachCheckOut(sessionId, user, payload = {}) {
        const session = await ExtracurricularSession.findByPk(sessionId);
        ensure(session, 'Sesi ekskul tidak ditemukan');
        await this._ensureCoachCanAccessExtracurricular(user, session.extracurricular_id);

        return session.update({
            coach_checkout_at: new Date(),
            coach_note: payload.coach_note || session.coach_note,
            actual_end_at: new Date(),
            updated_by: user.id
        });
    }

    async getSessionStudentAttendances(sessionId, currentUser = null) {
        const session = await ExtracurricularSession.findByPk(sessionId);
        ensure(session, 'Sesi ekskul tidak ditemukan');

        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, session.extracurricular_id);

        const members = await ExtracurricularMember.findAll({
            where: {
                extracurricular_id: session.extracurricular_id,
                academic_year_id: session.academic_year_id,
                status: 'ACTIVE'
            },
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'nisn'] },
                {
                    model: ExtracurricularStudentAttendance,
                    as: 'attendances',
                    where: { session_id: sessionId },
                    required: false
                }
            ],
            order: [[{ model: Student, as: 'student' }, 'full_name', 'ASC']]
        });

        return members.map(member => {
            const attendance = (member.attendances || [])[0] || null;
            return {
                member_id: member.id,
                student_id: member.student_id,
                student: member.student,
                attendance
            };
        });
    }

    async bulkMarkStudentAttendances(sessionId, payload, user) {
        ensure(Array.isArray(payload.attendances) && payload.attendances.length > 0, 'Data presensi siswa wajib berupa array');

        return sequelize.transaction(async (t) => {
            const session = await ExtracurricularSession.findByPk(sessionId, { transaction: t, lock: t.LOCK.UPDATE });
            ensure(session, 'Sesi ekskul tidak ditemukan');
            await this._ensureCoachCanAccessExtracurricular(user, session.extracurricular_id);

            ensure(session.status === 'OPEN', 'Presensi siswa hanya bisa diisi saat sesi OPEN');

            for (const row of payload.attendances) {
                ensure(row.student_id, 'student_id wajib diisi');
                ensureIn(row.attendance_status, allowedValues.student_attendance_status, 'Status presensi siswa');

                const member = await ExtracurricularMember.findOne({
                    where: {
                        extracurricular_id: session.extracurricular_id,
                        academic_year_id: session.academic_year_id,
                        student_id: row.student_id,
                        status: 'ACTIVE'
                    },
                    transaction: t
                });
                ensure(member, `Siswa ${row.student_id} bukan anggota aktif ekskul ini`);

                const existing = await ExtracurricularStudentAttendance.findOne({
                    where: { session_id: sessionId, student_id: row.student_id },
                    transaction: t
                });

                const attendancePayload = {
                    session_id: sessionId,
                    extracurricular_member_id: member.id,
                    student_id: row.student_id,
                    attendance_status: row.attendance_status,
                    checkin_at: row.checkin_at || null,
                    note: row.note || null,
                    marked_by: user.id,
                    marked_at: new Date()
                };

                if (existing) {
                    await existing.update(attendancePayload, { transaction: t });
                } else {
                    await ExtracurricularStudentAttendance.create(attendancePayload, { transaction: t });
                }
            }

            return this.getSessionStudentAttendances(sessionId, user);
        });
    }

    async getProgressAspects(query = {}, currentUser = null) {
        const where = {};
        if (query.extracurricular_id) where.extracurricular_id = query.extracurricular_id;
        if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

        if (currentUser && query.extracurricular_id) {
            await this._ensureCoachCanAccessExtracurricular(currentUser, parseInt(query.extracurricular_id, 10));
        }

        return ExtracurricularProgressAspect.findAll({
            where,
            order: [['sort_order', 'ASC'], ['name', 'ASC']]
        });
    }

    async createProgressAspect(payload, currentUser = null) {
        ensure(payload.extracurricular_id, 'Ekskul wajib diisi');
        ensure(payload.name, 'Nama aspek wajib diisi');
        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, payload.extracurricular_id);

        return ExtracurricularProgressAspect.create({
            extracurricular_id: payload.extracurricular_id,
            name: payload.name,
            description: payload.description || null,
            sort_order: payload.sort_order || 0,
            is_active: payload.is_active !== undefined ? !!payload.is_active : true
        });
    }

    async updateProgressAspect(id, payload, currentUser = null) {
        const item = await ExtracurricularProgressAspect.findByPk(id);
        ensure(item, 'Aspek perkembangan tidak ditemukan');

        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, item.extracurricular_id);

        return item.update({
            name: payload.name ?? item.name,
            description: payload.description ?? item.description,
            sort_order: payload.sort_order ?? item.sort_order,
            is_active: payload.is_active !== undefined ? !!payload.is_active : item.is_active
        });
    }

    async toggleProgressAspect(id, currentUser = null) {
        const item = await ExtracurricularProgressAspect.findByPk(id);
        ensure(item, 'Aspek perkembangan tidak ditemukan');

        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, item.extracurricular_id);

        return item.update({ is_active: !item.is_active });
    }

    async deleteProgressAspect(id, currentUser = null) {
        const item = await ExtracurricularProgressAspect.findByPk(id);
        ensure(item, 'Aspek perkembangan tidak ditemukan');

        if (currentUser) await this._ensureCoachCanAccessExtracurricular(currentUser, item.extracurricular_id);

        const linkedProgressCount = await ExtracurricularStudentProgress.count({
            where: { aspect_id: item.id }
        });
        ensure(linkedProgressCount === 0, 'Aspek tidak dapat dihapus karena sudah dipakai pada data perkembangan siswa');

        await item.destroy();
        return true;
    }

    async getStudentProgresses(query = {}, currentUser = null) {
        const { page, limit, offset } = this._pagination(query);

        const where = {};
        if (query.extracurricular_id) where.extracurricular_id = query.extracurricular_id;
        if (query.student_id) where.student_id = query.student_id;
        if (query.academic_year_id) where.academic_year_id = query.academic_year_id;
        if (query.session_id) where.session_id = query.session_id;
        if (query.aspect_id) where.aspect_id = query.aspect_id;
        if (query.date_from || query.date_to) {
            where.progress_date = {};
            if (query.date_from) where.progress_date[Op.gte] = query.date_from;
            if (query.date_to) where.progress_date[Op.lte] = query.date_to;
        }

        if (currentUser && !this._isElevated(currentUser)) {
            if ((currentUser.roles || []).includes('SISWA')) {
                const studentIds = await this._resolveStudentIdsForUser(currentUser);
                const memberships = await ExtracurricularMember.findAll({
                    where: {
                        student_id: studentIds.length ? { [Op.in]: studentIds } : -1
                    },
                    attributes: ['student_id', 'extracurricular_id']
                });
                const resolvedStudentIds = [...new Set(memberships.map(r => r.student_id))];
                const exIds = [...new Set(memberships.map(r => r.extracurricular_id))];
                where.student_id = resolvedStudentIds.length ? { [Op.in]: resolvedStudentIds } : -1;
                if (!query.extracurricular_id) where.extracurricular_id = exIds.length ? { [Op.in]: exIds } : -1;
            } else {
                const coach = await this._getCoachByUserId(currentUser.id);
                const assignments = coach
                    ? await ExtracurricularCoachAssignment.findAll({ where: { coach_id: coach.id, is_active: true }, attributes: ['extracurricular_id'] })
                    : [];
                const ids = assignments.map(item => item.extracurricular_id);
                where.extracurricular_id = ids.length ? { [Op.in]: ids } : -1;
            }
        }

        const { count, rows } = await ExtracurricularStudentProgress.findAndCountAll({
            where,
            include: [
                { model: Extracurricular, as: 'extracurricular', attributes: ['id', 'code', 'name'] },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'nisn'] },
                { model: ExtracurricularProgressAspect, as: 'aspect', attributes: ['id', 'name'], required: false },
                { model: ExtracurricularSession, as: 'session', attributes: ['id', 'session_date', 'session_title'], required: false },
                { model: User, as: 'creator', attributes: ['id', 'name'], required: false }
            ],
            limit,
            offset,
            order: [['progress_date', 'DESC'], ['created_at', 'DESC']]
        });

        return { items: rows, ...this._meta(count, page, limit) };
    }

    async createStudentProgress(payload, user) {
        ensure(payload.extracurricular_id, 'Ekskul wajib diisi');
        ensure(payload.student_id, 'Siswa wajib diisi');
        ensure(payload.academic_year_id, 'Tahun ajaran wajib diisi');
        ensure(payload.progress_date, 'Tanggal perkembangan wajib diisi');

        await this._ensureCoachCanAccessExtracurricular(user, payload.extracurricular_id);

        if (this._isProvided(payload.aspect_id)) {
            const aspect = await ExtracurricularProgressAspect.findOne({
                where: {
                    id: payload.aspect_id,
                    extracurricular_id: payload.extracurricular_id,
                    is_active: true
                }
            });
            ensure(aspect, 'Aspek perkembangan tidak valid untuk ekskul ini');
        }

        if (this._isProvided(payload.session_id)) {
            const session = await ExtracurricularSession.findByPk(payload.session_id);
            ensure(session, 'Sesi ekskul tidak ditemukan');
            ensure(session.extracurricular_id === parseInt(payload.extracurricular_id, 10), 'Sesi tidak sesuai dengan ekskul terpilih');
        }

        const member = await ExtracurricularMember.findOne({
            where: {
                extracurricular_id: payload.extracurricular_id,
                student_id: payload.student_id,
                academic_year_id: payload.academic_year_id,
                status: 'ACTIVE'
            }
        });
        ensure(member, 'Siswa bukan anggota aktif ekskul ini pada tahun ajaran terkait');

        return ExtracurricularStudentProgress.create({
            ...payload,
            extracurricular_member_id: member.id,
            created_by: user.id,
            updated_by: user.id
        });
    }

    async updateStudentProgress(id, payload, user) {
        const item = await ExtracurricularStudentProgress.findByPk(id);
        ensure(item, 'Data perkembangan tidak ditemukan');

        const extracurricularId = parseInt(payload.extracurricular_id || item.extracurricular_id, 10);
        const studentId = parseInt(payload.student_id || item.student_id, 10);
        const academicYearId = parseInt(payload.academic_year_id || item.academic_year_id, 10);

        await this._ensureCoachCanAccessExtracurricular(user, extracurricularId);

        if (this._isProvided(payload.aspect_id)) {
            const aspect = await ExtracurricularProgressAspect.findOne({
                where: { id: payload.aspect_id, extracurricular_id: extracurricularId }
            });
            ensure(aspect, 'Aspek perkembangan tidak valid untuk ekskul ini');
        }

        if (Object.prototype.hasOwnProperty.call(payload, 'session_id') && payload.session_id) {
            const session = await ExtracurricularSession.findByPk(payload.session_id);
            ensure(session, 'Sesi ekskul tidak ditemukan');
            ensure(session.extracurricular_id === extracurricularId, 'Sesi tidak sesuai dengan ekskul perkembangan');
        }

        let memberId = item.extracurricular_member_id;
        if (
            this._isProvided(payload.extracurricular_id) ||
            this._isProvided(payload.student_id) ||
            this._isProvided(payload.academic_year_id)
        ) {
            const member = await ExtracurricularMember.findOne({
                where: {
                    extracurricular_id: extracurricularId,
                    student_id: studentId,
                    academic_year_id: academicYearId,
                    status: 'ACTIVE'
                }
            });
            ensure(member, 'Siswa bukan anggota aktif ekskul ini pada tahun ajaran terkait');
            memberId = member.id;
        }

        return item.update({ ...payload, extracurricular_member_id: memberId, updated_by: user.id });
    }

    async deleteStudentProgress(id, user) {
        const item = await ExtracurricularStudentProgress.findByPk(id);
        ensure(item, 'Data perkembangan tidak ditemukan');

        await this._ensureCoachCanAccessExtracurricular(user, item.extracurricular_id);
        await item.destroy();
        return true;
    }

    async getMyExtracurricular(user) {
        if (this._isElevated(user)) {
            return this.getExtracurriculars({ limit: 50, page: 1 }, user);
        }

        const roles = user.roles || [];
        if (roles.includes('PELATIH_EKSKUL') || roles.includes('GURU')) {
            return this.getExtracurriculars({ limit: 50, page: 1 }, user);
        }

        const studentIds = await this._resolveStudentIdsForUser(user);
        const memberships = await ExtracurricularMember.findAll({
            where: {
                student_id: studentIds.length ? { [Op.in]: studentIds } : -1,
                status: 'ACTIVE'
            },
            include: [{ model: Extracurricular, as: 'extracurricular' }],
            order: [['created_at', 'DESC']]
        });

        const map = new Map();
        for (const member of memberships) {
            if (member.extracurricular) {
                map.set(member.extracurricular.id, member.extracurricular);
            }
        }

        return { items: Array.from(map.values()), totalItems: map.size, totalPages: 1, currentPage: 1 };
    }

    async getMyExtracurricularDetail(user, extracurricularId) {
        if (this._isElevated(user)) return this.getExtracurricularById(extracurricularId);

        const roles = user.roles || [];
        if (roles.includes('PELATIH_EKSKUL') || roles.includes('GURU')) {
            return this.getExtracurricularById(extracurricularId, user);
        }

        const studentIds = await this._resolveStudentIdsForUser(user);
        const membership = await ExtracurricularMember.findOne({
            where: {
                extracurricular_id: extracurricularId,
                student_id: studentIds.length ? { [Op.in]: studentIds } : -1,
                status: 'ACTIVE'
            }
        });
        ensure(membership, 'Akses ditolak untuk data ekskul ini');

        return this.getExtracurricularById(extracurricularId);
    }

    async getMyTodaySessions(user) {
        const today = new Date().toISOString().slice(0, 10);
        return this.getSessions({ date_from: today, date_to: today, limit: 50, page: 1 }, user);
    }

    async getMyAttendances(user, query = {}) {
        const roles = user.roles || [];
        if (roles.includes('PELATIH_EKSKUL') || roles.includes('GURU') || this._isElevated(user)) {
            return this.getSessions(query, user);
        }

        const studentIdsForUser = await this._resolveStudentIdsForUser(user);
        const memberships = await ExtracurricularMember.findAll({
            where: {
                student_id: studentIdsForUser.length ? { [Op.in]: studentIdsForUser } : -1
            },
            attributes: ['student_id']
        });
        const studentIds = [...new Set(memberships.map(r => r.student_id))];

        const { page, limit, offset } = this._pagination(query);
        const where = {
            student_id: studentIds.length ? { [Op.in]: studentIds } : -1
        };

        const { count, rows } = await ExtracurricularStudentAttendance.findAndCountAll({
            where,
            include: [
                {
                    model: ExtracurricularSession,
                    as: 'session',
                    include: [{ model: Extracurricular, as: 'extracurricular', attributes: ['id', 'name', 'code'] }]
                },
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] }
            ],
            limit,
            offset,
            order: [['marked_at', 'DESC']]
        });

        return { items: rows, ...this._meta(count, page, limit) };
    }

    async getMyProgress(user, query = {}) {
        return this.getStudentProgresses(query, user);
    }

    async getMyProgressAspects(user, extracurricularId, query = {}) {
        const parsedExtracurricularId = parseInt(extracurricularId, 10);
        ensure(parsedExtracurricularId, 'ID ekskul tidak valid');
        await this._ensureCoachCanAccessExtracurricular(user, parsedExtracurricularId);

        return this.getProgressAspects(
            { ...query, extracurricular_id: parsedExtracurricularId, is_active: query.is_active ?? 'true' },
            user
        );
    }

    async getMyStudentProgress(user, extracurricularId, studentId, query = {}) {
        const parsedExtracurricularId = parseInt(extracurricularId, 10);
        const parsedStudentId = parseInt(studentId, 10);
        ensure(parsedExtracurricularId, 'ID ekskul tidak valid');
        ensure(parsedStudentId, 'ID siswa tidak valid');

        await this._ensureCoachCanAccessExtracurricular(user, parsedExtracurricularId);

        const member = await ExtracurricularMember.findOne({
            where: {
                extracurricular_id: parsedExtracurricularId,
                student_id: parsedStudentId,
                status: 'ACTIVE'
            }
        });
        ensure(member, 'Siswa tidak terdaftar sebagai anggota aktif ekskul ini');

        return this.getStudentProgresses(
            {
                ...query,
                extracurricular_id: parsedExtracurricularId,
                student_id: parsedStudentId
            },
            user
        );
    }
}

module.exports = new ExtracurricularService();
