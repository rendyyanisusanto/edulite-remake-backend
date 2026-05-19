'use strict';

const { Op, fn, col, where, literal } = require('sequelize');
const db = require('../../models');
const minioSvc = require('../../core/services/minio.service');
const {
    ensure,
    validateCreateDeposit,
    validateUpdateDeposit,
    validateFinalReturn,
    validateCategory
} = require('./student_item_deposit.validator');

const {
    StudentItemCategory,
    StudentItemDeposit,
    StudentItemLoan,
    StudentItemFinalReturn,
    StudentItemDepositLog,
    StudentItemDepositSetting,
    Student,
    AcademicYear,
    Class,
    StudentClassHistory,
    User
} = db;

const PHOTO_FOLDER = 'student-item-deposits';

class StudentItemDepositService {
    async getAppSettings() {
        try {
            const [rows] = await db.sequelize.query('SELECT active_academic_year_id, max_upload_size_mb FROM app_settings ORDER BY id DESC LIMIT 1');
            return rows[0] || null;
        } catch (error) {
            return null;
        }
    }

    async uploadPhoto(file, subfolder = 'in') {
        if (!file) return null;
        const appSetting = await this.getAppSettings();
        const maxMb = Number(appSetting && appSetting.max_upload_size_mb ? appSetting.max_upload_size_mb : 5);
        const maxBytes = maxMb * 1024 * 1024;
        ensure(file.size <= maxBytes, `Ukuran file melebihi batas ${maxMb} MB`, 'VALIDATION_ERROR', 422);
        return minioSvc.uploadFile(`${PHOTO_FOLDER}/${subfolder}`, file.originalname, file.buffer, file.mimetype);
    }

    async getActiveAcademicYearId() {
        const appSetting = await this.getAppSettings();
        if (appSetting && appSetting.active_academic_year_id) {
            return appSetting.active_academic_year_id;
        }

        const activeYear = await AcademicYear.findOne({ where: { is_active: true }, attributes: ['id'] });
        return activeYear ? activeYear.id : null;
    }

    async getSetting() {
        const setting = await StudentItemDepositSetting.findOne({ where: { is_active: true }, order: [['id', 'DESC']] });
        if (setting) return setting;
        return StudentItemDepositSetting.findOne({ order: [['id', 'ASC']] });
    }

    async getClassIdByStudentAndYear(studentId, academicYearId) {
        if (!academicYearId) return null;
        const latest = await StudentClassHistory.findOne({
            where: { student_id: studentId, academic_year_id: academicYearId },
            order: [['id', 'DESC']],
            attributes: ['class_id']
        });
        return latest ? latest.class_id : null;
    }

    async generateDepositCode(transaction) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const ym = `${year}${month}`;

        const latest = await StudentItemDeposit.findOne({
            where: { code: { [Op.like]: `BT-${ym}-%` } },
            order: [['id', 'DESC']],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        let next = 1;
        if (latest && latest.code) {
            const parts = latest.code.split('-');
            const seq = parseInt(parts[2], 10);
            next = Number.isNaN(seq) ? 1 : seq + 1;
        }

        return `BT-${ym}-${String(next).padStart(4, '0')}`;
    }

    buildDepositWhere(query = {}) {
        const base = {};
        if (query.student_id) base.student_id = query.student_id;
        if (query.class_id) base.class_id = query.class_id;
        if (query.academic_year_id) base.academic_year_id = query.academic_year_id;
        if (query.category_id) base.category_id = query.category_id;
        if (query.current_status) base.current_status = query.current_status;
        if (query.deposit_date_from || query.deposit_date_to) {
            base.deposit_date = {};
            if (query.deposit_date_from) base.deposit_date[Op.gte] = `${query.deposit_date_from} 00:00:00`;
            if (query.deposit_date_to) base.deposit_date[Op.lte] = `${query.deposit_date_to} 23:59:59`;
        }
        const search = query.search || '';
        if (search) {
            base[Op.or] = [
                { code: { [Op.like]: `%${search}%` } },
                { item_name: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } },
                { model: { [Op.like]: `%${search}%` } },
                { serial_number: { [Op.like]: `%${search}%` } },
                { imei: { [Op.like]: `%${search}%` } },
                where(col('student.full_name'), { [Op.like]: `%${search}%` }),
                where(col('student.nis'), { [Op.like]: `%${search}%` }),
                where(col('student.nisn'), { [Op.like]: `%${search}%` })
            ];
        }
        return base;
    }

    async writeLog({ depositId, action, oldStatus = null, newStatus = null, source = 'WEB_ADMIN', note = null, userId = null, transaction }) {
        return StudentItemDepositLog.create({
            deposit_id: depositId,
            action,
            old_status: oldStatus,
            new_status: newStatus,
            source,
            note,
            created_by: userId
        }, { transaction });
    }

    depositIncludes() {
        return [
            { model: Student, as: 'student', attributes: ['id', 'nis', 'nisn', 'full_name', 'rfid_code'] },
            { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false },
            { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
            { model: StudentItemCategory, as: 'category', attributes: ['id', 'name'] },
            { model: User, as: 'receivedBy', attributes: ['id', 'name'], required: false },
            { model: User, as: 'createdBy', attributes: ['id', 'name'], required: false },
            { model: User, as: 'updatedBy', attributes: ['id', 'name'], required: false }
        ];
    }

    async getCategories(query = {}) {
        const whereClause = {};
        if (query.id) whereClause.id = query.id;
        if (query.is_active !== undefined) whereClause.is_active = String(query.is_active) === 'true';
        return StudentItemCategory.findAll({ where: whereClause, order: [['name', 'ASC']] });
    }

    async createCategory(payload) {
        validateCategory(payload);
        const exists = await StudentItemCategory.findOne({ where: { name: payload.name } });
        ensure(!exists, 'Nama kategori sudah digunakan', 'CONFLICT', 409);
        return StudentItemCategory.create({ name: payload.name, description: payload.description || null, is_active: payload.is_active !== false });
    }

    async updateCategory(id, payload) {
        validateCategory(payload);
        const category = await StudentItemCategory.findByPk(id);
        ensure(category, 'Kategori tidak ditemukan', 'NOT_FOUND', 404);
        const exists = await StudentItemCategory.findOne({ where: { name: payload.name, id: { [Op.ne]: id } } });
        ensure(!exists, 'Nama kategori sudah digunakan', 'CONFLICT', 409);
        await category.update({ name: payload.name, description: payload.description || null, is_active: payload.is_active !== false });
        return category;
    }

    async deleteCategory(id) {
        const category = await StudentItemCategory.findByPk(id);
        ensure(category, 'Kategori tidak ditemukan', 'NOT_FOUND', 404);
        const used = await StudentItemDeposit.count({ where: { category_id: id } });
        ensure(!used, 'Kategori sudah dipakai data penitipan', 'BUSINESS_RULE_ERROR', 422);
        await category.destroy();
    }

    async createDeposit(payload, user, file) {
        validateCreateDeposit(payload);
        let depositId = null;

        await db.sequelize.transaction(async (transaction) => {
            const student = await Student.findByPk(payload.student_id, { transaction });
            ensure(student, 'Siswa tidak ditemukan', 'NOT_FOUND', 404);

            const category = await StudentItemCategory.findByPk(payload.category_id, { transaction });
            ensure(category, 'Kategori tidak ditemukan', 'NOT_FOUND', 404);
            ensure(category.is_active, 'Kategori tidak aktif', 'BUSINESS_RULE_ERROR', 422);

            const academicYearId = await this.getActiveAcademicYearId();
            const classId = await this.getClassIdByStudentAndYear(payload.student_id, academicYearId);
            const code = await this.generateDepositCode(transaction);
            const photoIn = await this.uploadPhoto(file, 'in');

            const data = await StudentItemDeposit.create({
                code,
                student_id: payload.student_id,
                academic_year_id: academicYearId,
                class_id: classId,
                category_id: payload.category_id,
                item_name: payload.item_name,
                brand: payload.brand || null,
                model: payload.model || null,
                color: payload.color || null,
                serial_number: payload.serial_number || null,
                imei: payload.imei || null,
                condition_in: payload.condition_in || null,
                accessories: payload.accessories || null,
                storage_location: payload.storage_location || null,
                deposit_date: payload.deposit_date || new Date(),
                received_by: user.id,
                current_status: 'DEPOSITED',
                photo_in: photoIn,
                notes: payload.notes || null,
                created_by: user.id,
                updated_by: user.id
            }, { transaction });

            await this.writeLog({
                depositId: data.id,
                action: 'CREATED',
                oldStatus: null,
                newStatus: 'DEPOSITED',
                source: 'WEB_ADMIN',
                note: payload.notes || null,
                userId: user.id,
                transaction
            });

            depositId = data.id;
        });

        return this.getDepositById(depositId);
    }

    async updateDeposit(id, payload, user, file) {
        validateUpdateDeposit(payload);
        return db.sequelize.transaction(async (transaction) => {
            const deposit = await StudentItemDeposit.findByPk(id, { transaction });
            ensure(deposit, 'Data penitipan tidak ditemukan', 'NOT_FOUND', 404);
            ensure(!['RETURNED', 'CANCELLED'].includes(deposit.current_status), 'Data tidak dapat diubah', 'BUSINESS_RULE_ERROR', 422);

            const patch = { ...payload, updated_by: user.id };
            delete patch.current_status;
            delete patch.received_by;
            delete patch.created_by;

            if (patch.student_id || patch.academic_year_id) {
                const academicYearId = patch.academic_year_id || deposit.academic_year_id || await this.getActiveAcademicYearId();
                patch.class_id = await this.getClassIdByStudentAndYear(patch.student_id || deposit.student_id, academicYearId);
            }
            if (patch.category_id) {
                const category = await StudentItemCategory.findByPk(patch.category_id, { transaction });
                ensure(category && category.is_active, 'Kategori tidak valid/aktif', 'BUSINESS_RULE_ERROR', 422);
            }

            if (file) {
                patch.photo_in = await this.uploadPhoto(file, 'in');
            }

            await deposit.update(patch, { transaction });
            await this.writeLog({
                depositId: deposit.id,
                action: 'UPDATED',
                oldStatus: deposit.current_status,
                newStatus: deposit.current_status,
                source: 'WEB_ADMIN',
                note: payload.notes || null,
                userId: user.id,
                transaction
            });

            return this.getDepositById(deposit.id);
        });
    }

    async getDeposits(query = {}) {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await StudentItemDeposit.findAndCountAll({
            where: this.buildDepositWhere(query),
            include: this.depositIncludes(),
            order: [['deposit_date', 'DESC'], ['id', 'DESC']],
            limit,
            offset,
            distinct: true
        });

        return {
            items: rows,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    }

    async getDepositById(id) {
        const item = await StudentItemDeposit.findByPk(id, {
            include: [
                ...this.depositIncludes(),
                {
                    model: StudentItemLoan,
                    as: 'loans',
                    include: [
                        { model: User, as: 'borrowApprovedBy', attributes: ['id', 'name'], required: false },
                        { model: User, as: 'returnConfirmedBy', attributes: ['id', 'name'], required: false }
                    ],
                    required: false
                },
                {
                    model: StudentItemFinalReturn,
                    as: 'finalReturns',
                    include: [{ model: User, as: 'handedBy', attributes: ['id', 'name'] }],
                    required: false
                },
                {
                    model: StudentItemDepositLog,
                    as: 'logs',
                    include: [{ model: User, as: 'createdBy', attributes: ['id', 'name'], required: false }],
                    required: false
                }
            ],
            order: [
                [{ model: StudentItemLoan, as: 'loans' }, 'id', 'DESC'],
                [{ model: StudentItemDepositLog, as: 'logs' }, 'id', 'DESC']
            ]
        });
        ensure(item, 'Data penitipan tidak ditemukan', 'NOT_FOUND', 404);
        return item;
    }

    async getCategoryById(id) {
        const item = await StudentItemCategory.findByPk(id);
        ensure(item, 'Kategori tidak ditemukan', 'NOT_FOUND', 404);
        return item;
    }

    ensureLoanWindow(setting) {
        if (!setting) return;
        if (!setting.loan_start_time || !setting.loan_end_time) return;
        const now = new Date();
        const current = now.toTimeString().slice(0, 8);
        ensure(current >= setting.loan_start_time && current <= setting.loan_end_time, 'Di luar jam peminjaman', 'BUSINESS_RULE_ERROR', 422);
    }

    async loanDeposit(id, payload = {}, user = null, source = 'WEB_ADMIN') {
        return db.sequelize.transaction(async (transaction) => {
            const deposit = await StudentItemDeposit.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            ensure(deposit, 'Data penitipan tidak ditemukan', 'NOT_FOUND', 404);
            ensure(deposit.current_status === 'DEPOSITED', 'Barang tidak dapat dipinjam. Status harus DEPOSITED.', 'BUSINESS_RULE_ERROR', 422);

            const setting = await this.getSetting();
            ensure(!setting || setting.allow_daily_loan, 'Peminjaman harian tidak diizinkan', 'BUSINESS_RULE_ERROR', 422);
            if (setting && setting.require_staff_approval_for_borrow && source !== 'RFID_KIOSK') {
                ensure(payload.borrow_approved_by || (user && user.id), 'Persetujuan petugas wajib diisi', 'BUSINESS_RULE_ERROR', 422);
            }
            this.ensureLoanWindow(setting);

            const activeByDeposit = await StudentItemLoan.count({ where: { deposit_id: id, status: 'BORROWED' }, transaction });
            ensure(activeByDeposit === 0, 'Barang sedang dipinjam', 'BUSINESS_RULE_ERROR', 422);

            const activeByStudent = await StudentItemLoan.count({ where: { student_id: deposit.student_id, status: 'BORROWED' }, transaction });
            const maxActive = setting ? setting.max_active_loans_per_student : 1;
            ensure(activeByStudent < maxActive, 'Melebihi maksimal pinjaman aktif', 'BUSINESS_RULE_ERROR', 422);

            await StudentItemLoan.create({
                deposit_id: deposit.id,
                student_id: deposit.student_id,
                loan_date: new Date().toISOString().slice(0, 10),
                borrowed_at: new Date(),
                borrow_method: payload.borrow_method || (source === 'RFID_KIOSK' ? 'RFID_KIOSK' : 'WEB_ADMIN'),
                borrow_rfid_code: payload.borrow_rfid_code || null,
                borrow_approved_by: payload.borrow_approved_by || (user ? user.id : null),
                borrow_note: payload.borrow_note || null,
                status: 'BORROWED',
                created_by: user ? user.id : null,
                updated_by: user ? user.id : null
            }, { transaction });

            await deposit.update({ current_status: 'BORROWED', updated_by: user ? user.id : null }, { transaction });

            await this.writeLog({
                depositId: deposit.id,
                action: 'BORROWED',
                oldStatus: 'DEPOSITED',
                newStatus: 'BORROWED',
                source,
                note: payload.borrow_note || null,
                userId: user ? user.id : null,
                transaction
            });

            return this.getDepositById(deposit.id);
        });
    }

    async returnDaily(id, payload = {}, user = null, source = 'WEB_ADMIN') {
        return db.sequelize.transaction(async (transaction) => {
            const deposit = await StudentItemDeposit.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            ensure(deposit, 'Data penitipan tidak ditemukan', 'NOT_FOUND', 404);
            ensure(deposit.current_status === 'BORROWED', 'Status barang harus BORROWED', 'BUSINESS_RULE_ERROR', 422);

            const activeLoan = await StudentItemLoan.findOne({ where: { deposit_id: id, status: 'BORROWED' }, transaction, lock: transaction.LOCK.UPDATE });
            ensure(activeLoan, 'Loan aktif tidak ditemukan', 'BUSINESS_RULE_ERROR', 422);
            const setting = await this.getSetting();
            if (setting && setting.require_staff_approval_for_return && source !== 'RFID_KIOSK') {
                ensure(payload.return_confirmed_by || (user && user.id), 'Konfirmasi petugas wajib diisi', 'BUSINESS_RULE_ERROR', 422);
            }

            if (source === 'RFID_KIOSK' && payload.rfid_code) {
                const student = await Student.findByPk(deposit.student_id, { transaction });
                ensure(student && student.rfid_code === payload.rfid_code, 'RFID tidak sesuai pemilik barang', 'BUSINESS_RULE_ERROR', 422);
            }

            await activeLoan.update({
                returned_at: new Date(),
                return_method: payload.return_method || (source === 'RFID_KIOSK' ? 'RFID_KIOSK' : 'WEB_ADMIN'),
                return_rfid_code: payload.return_rfid_code || payload.rfid_code || null,
                return_confirmed_by: payload.return_confirmed_by || (user ? user.id : null),
                return_note: payload.return_note || null,
                status: 'RETURNED',
                updated_by: user ? user.id : null
            }, { transaction });

            await deposit.update({ current_status: 'DEPOSITED', updated_by: user ? user.id : null }, { transaction });

            await this.writeLog({
                depositId: deposit.id,
                action: 'RETURNED_DAILY',
                oldStatus: 'BORROWED',
                newStatus: 'DEPOSITED',
                source,
                note: payload.return_note || null,
                userId: user ? user.id : null,
                transaction
            });

            return this.getDepositById(deposit.id);
        });
    }

    async finalReturn(id, payload = {}, user, file) {
        validateFinalReturn(payload);
        return db.sequelize.transaction(async (transaction) => {
            const deposit = await StudentItemDeposit.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            ensure(deposit, 'Data penitipan tidak ditemukan', 'NOT_FOUND', 404);
            if (deposit.current_status === 'BORROWED') {
                ensure(false, 'Barang masih dipinjam. Kembalikan barang terlebih dahulu sebelum ambil permanen.', 'BUSINESS_RULE_ERROR', 422);
            }
            ensure(deposit.current_status === 'DEPOSITED', 'Hanya barang DEPOSITED yang bisa diambil permanen', 'BUSINESS_RULE_ERROR', 422);

            const photoOut = await this.uploadPhoto(file, 'out');

            await StudentItemFinalReturn.create({
                deposit_id: deposit.id,
                return_date: payload.return_date || new Date(),
                returned_to: payload.returned_to,
                returned_to_type: payload.returned_to_type,
                returned_to_relation: payload.returned_to_relation || null,
                return_reason: payload.return_reason || null,
                condition_out: payload.condition_out || null,
                handed_by: user.id,
                photo_out: photoOut,
                notes: payload.notes || null,
                created_by: user.id,
                updated_by: user.id
            }, { transaction });

            await deposit.update({ current_status: 'RETURNED', updated_by: user.id }, { transaction });

            await this.writeLog({
                depositId: deposit.id,
                action: 'FINAL_RETURNED',
                oldStatus: 'DEPOSITED',
                newStatus: 'RETURNED',
                source: 'WEB_ADMIN',
                note: payload.notes || null,
                userId: user.id,
                transaction
            });

            return this.getDepositById(deposit.id);
        });
    }

    async cancelDeposit(id, payload = {}, user) {
        return this.updateStatus(id, 'CANCELLED', {
            allowedStatuses: ['DEPOSITED'],
            action: 'CANCELLED',
            note: payload.note || payload.notes || null,
            userId: user.id
        });
    }

    async markLost(id, payload = {}, user) {
        return db.sequelize.transaction(async (transaction) => {
            const deposit = await StudentItemDeposit.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            ensure(deposit, 'Data penitipan tidak ditemukan', 'NOT_FOUND', 404);
            ensure(['DEPOSITED', 'BORROWED'].includes(deposit.current_status), 'Status barang tidak valid untuk tandai hilang', 'BUSINESS_RULE_ERROR', 422);

            if (deposit.current_status === 'BORROWED') {
                const activeLoan = await StudentItemLoan.findOne({ where: { deposit_id: deposit.id, status: 'BORROWED' }, transaction });
                if (activeLoan) {
                    await activeLoan.update({ status: 'CANCELLED', return_note: 'Ditutup otomatis karena barang ditandai hilang', updated_by: user.id }, { transaction });
                }
            }

            const oldStatus = deposit.current_status;
            await deposit.update({ current_status: 'LOST', updated_by: user.id }, { transaction });
            await this.writeLog({ depositId: deposit.id, action: 'LOST', oldStatus, newStatus: 'LOST', source: 'WEB_ADMIN', note: payload.note || null, userId: user.id, transaction });
            return this.getDepositById(deposit.id);
        });
    }

    async markDamaged(id, payload = {}, user) {
        return this.updateStatus(id, 'DAMAGED', {
            allowedStatuses: ['DEPOSITED', 'BORROWED'],
            action: 'DAMAGED',
            note: payload.note || null,
            userId: user.id
        });
    }

    async updateStatus(id, newStatus, { allowedStatuses, action, note, userId }) {
        return db.sequelize.transaction(async (transaction) => {
            const deposit = await StudentItemDeposit.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
            ensure(deposit, 'Data penitipan tidak ditemukan', 'NOT_FOUND', 404);
            ensure(allowedStatuses.includes(deposit.current_status), 'Status barang tidak valid untuk proses ini', 'BUSINESS_RULE_ERROR', 422);
            const oldStatus = deposit.current_status;
            await deposit.update({ current_status: newStatus, updated_by: userId }, { transaction });
            await this.writeLog({ depositId: deposit.id, action, oldStatus, newStatus, source: 'WEB_ADMIN', note, userId, transaction });
            return this.getDepositById(deposit.id);
        });
    }

    async getLoans(query = {}, mode = 'all') {
        const page = parseInt(query.page, 10) || 1;
        const limit = parseInt(query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (query.student_id) whereClause.student_id = query.student_id;
        if (query.status) whereClause.status = query.status;
        if (query.loan_date_from || query.loan_date_to) {
            whereClause.loan_date = {};
            if (query.loan_date_from) whereClause.loan_date[Op.gte] = query.loan_date_from;
            if (query.loan_date_to) whereClause.loan_date[Op.lte] = query.loan_date_to;
        }

        if (mode === 'active') whereClause.status = 'BORROWED';

        const search = query.search || '';
        const include = [
            {
                model: StudentItemDeposit,
                as: 'deposit',
                include: [
                    { model: StudentItemCategory, as: 'category', attributes: ['id', 'name'] },
                    { model: Class, as: 'class', attributes: ['id', 'name'], required: false },
                    { model: AcademicYear, as: 'academic_year', attributes: ['id', 'name'], required: false }
                ]
            },
            { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis', 'nisn'] },
            { model: User, as: 'borrowApprovedBy', attributes: ['id', 'name'], required: false },
            { model: User, as: 'returnConfirmedBy', attributes: ['id', 'name'], required: false }
        ];

        if (query.class_id) {
            include[0].where = { ...(include[0].where || {}), class_id: query.class_id };
        }
        if (query.academic_year_id) {
            include[0].where = { ...(include[0].where || {}), academic_year_id: query.academic_year_id };
        }
        if (query.category_id) {
            include[0].where = { ...(include[0].where || {}), category_id: query.category_id };
        }

        if (search) {
            whereClause[Op.or] = [
                where(col('student.full_name'), { [Op.like]: `%${search}%` }),
                where(col('student.nis'), { [Op.like]: `%${search}%` }),
                where(col('deposit.code'), { [Op.like]: `%${search}%` }),
                where(col('deposit.item_name'), { [Op.like]: `%${search}%` })
            ];
        }

        const queryOptions = {
            where: whereClause,
            include,
            order: [['borrowed_at', 'DESC']],
            distinct: true
        };
        if (mode !== 'overdue') {
            queryOptions.limit = limit;
            queryOptions.offset = offset;
        }

        const data = await StudentItemLoan.findAndCountAll(queryOptions);

        let items = data.rows;
        let overdueCount = null;
        if (mode === 'overdue') {
            const setting = await this.getSetting();
            if (!setting || !setting.return_deadline_time) {
                items = [];
                overdueCount = 0;
            } else {
                const now = new Date();
                const filtered = items.filter((item) => {
                    if (item.status !== 'BORROWED' || !item.borrowed_at) return false;
                    const d = new Date(item.borrowed_at);
                    const [h, m, s] = setting.return_deadline_time.split(':').map((v) => parseInt(v, 10));
                    d.setHours(h || 0, m || 0, s || 0, 0);
                    return now > d;
                });
                overdueCount = filtered.length;
                items = filtered;
            }
            const start = (page - 1) * limit;
            items = items.slice(start, start + limit);
        }

        return {
            items,
            totalItems: mode === 'overdue' ? overdueCount : data.count,
            totalPages: Math.ceil((mode === 'overdue' ? overdueCount : data.count) / limit) || 1,
            currentPage: page
        };
    }

    async getLogs(depositId) {
        return StudentItemDepositLog.findAll({
            where: { deposit_id: depositId },
            include: [{ model: User, as: 'createdBy', attributes: ['id', 'name'], required: false }],
            order: [['id', 'DESC']]
        });
    }

    async getDashboard() {
        const [totalDeposited, borrowed, returned, lostDamaged, loansToday, activeBorrowed] = await Promise.all([
            StudentItemDeposit.count(),
            StudentItemDeposit.count({ where: { current_status: 'BORROWED' } }),
            StudentItemDeposit.count({ where: { current_status: 'RETURNED' } }),
            StudentItemDeposit.count({ where: { current_status: { [Op.in]: ['LOST', 'DAMAGED'] } } }),
            StudentItemLoan.count({ where: { loan_date: new Date().toISOString().slice(0, 10) } }),
            StudentItemLoan.count({ where: { status: 'BORROWED' } })
        ]);

        const topCategories = await StudentItemDeposit.findAll({
            attributes: ['category_id', [fn('COUNT', col('StudentItemDeposit.id')), 'total']],
            include: [{ model: StudentItemCategory, as: 'category', attributes: ['id', 'name'] }],
            group: ['category_id'],
            order: [[literal('total'), 'DESC']],
            limit: 5
        });

        const recentLoans = await StudentItemLoan.findAll({
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: StudentItemDeposit, as: 'deposit', attributes: ['id', 'code', 'item_name'] }
            ],
            order: [['borrowed_at', 'DESC']],
            limit: 10
        });

        const overdue = await this.getLoans({ page: 1, limit: 20 }, 'overdue');

        return {
            cards: {
                total_deposited: totalDeposited,
                currently_borrowed: borrowed,
                final_returned: returned,
                loans_today: loansToday,
                not_returned: activeBorrowed,
                lost_or_damaged: lostDamaged
            },
            top_categories: topCategories,
            recent_loans: recentLoans,
            overdue_items: overdue.items
        };
    }

    async updateSetting(id, payload, user) {
        const setting = await StudentItemDepositSetting.findByPk(id);
        ensure(setting, 'Pengaturan tidak ditemukan', 'NOT_FOUND', 404);
        await setting.update({ ...payload, updated_by: user.id });
        return setting;
    }

    async rfidScan(rfidCode) {
        ensure(rfidCode, 'rfid_code wajib diisi');
        const student = await Student.findOne({ where: { rfid_code: rfidCode, rfid_is_active: true }, attributes: ['id', 'nis', 'full_name'] });
        ensure(student, 'Kartu RFID tidak terdaftar', 'NOT_FOUND', 404);

        const activeAcademicYearId = await this.getActiveAcademicYearId();
        const classHistory = activeAcademicYearId
            ? await StudentClassHistory.findOne({ where: { student_id: student.id, academic_year_id: activeAcademicYearId }, include: [{ model: Class, as: 'class_info', attributes: ['id', 'name'] }], order: [['id', 'DESC']] })
            : null;

        const items = await StudentItemDeposit.findAll({
            where: { student_id: student.id, current_status: { [Op.in]: ['DEPOSITED', 'BORROWED'] } },
            include: [{ model: StudentItemCategory, as: 'category', attributes: ['id', 'name'] }],
            attributes: ['id', 'code', 'item_name', 'current_status', 'storage_location'],
            order: [['id', 'DESC']]
        });

        return {
            student: {
                id: student.id,
                nis: student.nis,
                full_name: student.full_name,
                class_name: classHistory && classHistory.class_info ? classHistory.class_info.name : '-'
            },
            items: items.map((item) => ({
                id: item.id,
                code: item.code,
                item_name: item.item_name,
                category_name: item.category ? item.category.name : null,
                current_status: item.current_status,
                storage_location: item.storage_location
            }))
        };
    }

    async getTodayKioskHistory() {
        const today = new Date().toISOString().slice(0, 10);
        const loans = await StudentItemLoan.findAll({
            where: { loan_date: today },
            include: [
                { model: Student, as: 'student', attributes: ['id', 'full_name', 'nis'] },
                { model: StudentItemDeposit, as: 'deposit', attributes: ['id', 'code', 'item_name'] }
            ],
            order: [['borrowed_at', 'DESC']],
            limit: 100
        });

        const items = loans.map((loan) => ({
            id: loan.id,
            student_name: loan.student ? loan.student.full_name : '-',
            nis: loan.student ? loan.student.nis : '-',
            item_code: loan.deposit ? loan.deposit.code : '-',
            item_name: loan.deposit ? loan.deposit.item_name : '-',
            jam_pinjam: loan.borrowed_at || null,
            jam_kembali: loan.returned_at || null,
            status: loan.status
        }));

        return {
            tanggal: today,
            total: items.length,
            sudah_kembali: items.filter((x) => x.status === 'RETURNED').length,
            belum_kembali: items.filter((x) => x.status === 'BORROWED').length,
            items
        };
    }

    async printData(id) {
        const deposit = await this.getDepositById(id);
        const [schoolRows] = await db.sequelize.query('SELECT * FROM school_profiles ORDER BY id DESC LIMIT 1');
        return {
            school_profile: schoolRows[0] || null,
            deposit
        };
    }
}

module.exports = new StudentItemDepositService();
