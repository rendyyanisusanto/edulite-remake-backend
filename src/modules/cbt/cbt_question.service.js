'use strict';
const db = require('../../models');
const { Op } = require('sequelize');

class CbtQuestionService {

    // Helper: Verify Question Bank ownership & structure
    async _checkPermissionAndLockBank(bankId, userId, hasViewAllAccess, transaction = null) {
        const queryOpts = {
            include: [{ model: db.Teacher, as: 'creator_teacher', required: false }] // optional if needed
        };
        if (transaction) queryOpts.transaction = transaction;

        const bank = await db.CbtQuestionBank.findByPk(bankId, queryOpts);

        if (!bank) {
            throw new Error('Bank Soal tidak ditemukan.');
        }

        if (!hasViewAllAccess && bank.created_by !== userId) {
            throw new Error('Anda tidak memiliki akses ke bank soal ini.');
        }

        if (bank.status === 'ARCHIVED') {
            throw new Error('Bank soal diarsipkan. Anda tidak dapat memodifikasi soal di dalamnya.');
        }

        return bank;
    }

    _validateTypeSpecifics(type, options, answerKey) {
        if (type === 'SINGLE_CHOICE') {
            if (!options || options.length < 2) throw new Error('Soal pilihan ganda harus memiliki setidaknya dua pilihan.');
            let correctCount = options.filter(o => o.is_correct).length;
            if (correctCount !== 1) throw new Error('Soal pilihan ganda harus memiliki tepat satu jawaban benar (is_correct).');
        }
        else if (type === 'MULTIPLE_CHOICE') {
            if (!options || options.length < 2) throw new Error('Soal pilihan ganda kompleks harus memiliki setidaknya dua pilihan.');
            let correctCount = options.filter(o => o.is_correct).length;
            if (correctCount < 1) throw new Error('Soal pilihan ganda kompleks harus memiliki minimal satu jawaban benar.');
        }
        else if (type === 'TRUE_FALSE') {
            if (!options || options.length !== 2) throw new Error('Soal benar/salah wajib memiliki tepat dua pilihan (Benar dan Salah).');
            let correctCount = options.filter(o => o.is_correct).length;
            if (correctCount !== 1) throw new Error('Tepat satu pilihan harus bernilai benar.');
        }
        else if (type === 'SHORT_ANSWER') {
            if (!answerKey || !answerKey.acceptedAnswers || !Array.isArray(answerKey.acceptedAnswers) || answerKey.acceptedAnswers.length === 0) {
                throw new Error('Soal isian singkat harus memiliki minimal satu jawaban yang diterima secara eksplisit (acceptedAnswers).');
            }
        }
        else if (type === 'ESSAY') {
            // Note: Essay doesn't strict require modelAnswer. Just pass whatever answerKey is there (or empty JSON).
        } else {
            throw new Error('Jenis soal tidak valid.');
        }
    }

    async findAll(bankId, optionsParams) {
        const {
            userId, hasViewAllAccess,
            page = 1, limit = 10, search,
            question_type, difficulty, status,
            sort_by = 'created_at', sort_order = 'DESC'
        } = optionsParams;

        // Check ownership first
        await this._checkPermissionAndLockBank(bankId, userId, hasViewAllAccess);

        const offset = (page - 1) * limit;
        const where = { question_bank_id: bankId };

        if (question_type) where.question_type = question_type;
        if (difficulty) where.difficulty = difficulty;
        if (status) where.status = status;

        if (search) {
            // Searching only question_text
            where.question_text = { [Op.like]: `%${search}%` };
        }

        const allowedSorts = ['created_at', 'updated_at', 'question_type', 'difficulty', 'default_score'];
        const order = allowedSorts.includes(sort_by)
            ? [[sort_by, sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']]
            : [['created_at', 'ASC']];

        const { count, rows } = await db.CbtQuestion.findAndCountAll({
            where,
            attributes: [
                'id', 'question_type', 'question_text', 'difficulty',
                'default_score', 'status', 'created_at', 'updated_at'
            ],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order
        });

        // The exact choices and answer keys will not be returned to list endpoints due to specs restrictions.

        return {
            total: count,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total_pages: Math.ceil(count / limit),
            data: rows
        };
    }

    async findById(bankId, questionId, userId, hasViewAllAccess) {
        await this._checkPermissionAndLockBank(bankId, userId, hasViewAllAccess);

        const question = await db.CbtQuestion.findOne({
            where: { id: questionId, question_bank_id: bankId },
            include: [{ model: db.CbtQuestionOption, as: 'options' }], // Ensure correct alias
            order: [[{ model: db.CbtQuestionOption, as: 'options' }, 'sort_order', 'ASC']]
        });

        if (!question) throw new Error('Soal tidak ditemukan dalam bank soal ini.');

        return question;
    }

    async create(bankId, payload, userId, hasViewAllAccess) {
        const {
            question_type, question_text, media_url, difficulty = 'MEDIUM',
            default_score = 1.0, answer_key, explanation, options
        } = payload;

        if (!question_text || question_text.trim() === '') {
            throw new Error('Isi soal tidak boleh kosong.');
        }

        if (default_score < 0) {
            throw new Error('Bobot tidak valid. Harus lebih besar dari atau sama dengan nol.');
        }

        // We check valid rules for this specific creation type
        this._validateTypeSpecifics(question_type, options, answer_key);

        const transaction = await db.sequelize.transaction();

        try {
            await this._checkPermissionAndLockBank(bankId, userId, hasViewAllAccess, transaction);

            // Structure options properly
            let formattedOptions = [];
            if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(question_type)) {
                const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                formattedOptions = options.map((opt, i) => ({
                    option_key: keys[i] || `O${i}`,
                    option_text: opt.option_text,
                    media_url: opt.media_url || null,
                    is_correct: opt.is_correct === true,
                    sort_order: i
                }));
            } else if (question_type === 'TRUE_FALSE') {
                formattedOptions = [
                    { option_key: 'A', option_text: 'Benar', sort_order: 0, is_correct: !!options[0]?.is_correct },
                    { option_key: 'B', option_text: 'Salah', sort_order: 1, is_correct: !!options[1]?.is_correct }
                ];
            }

            // Cleanup answer keys
            let finalAnswerKey = null;
            if (question_type === 'SHORT_ANSWER') {
                // filter empty and duplicates, and trim strings
                let accepted = answer_key.acceptedAnswers.map(a => typeof a === 'string' ? a.trim() : '').filter(a => a !== '');
                accepted = [...new Set(accepted)];

                finalAnswerKey = {
                    acceptedAnswers: accepted,
                    caseSensitive: answer_key.caseSensitive === true,
                    trimWhitespace: answer_key.trimWhitespace !== false // default true
                };
            } else if (question_type === 'ESSAY') {
                finalAnswerKey = {
                    modelAnswer: answer_key?.modelAnswer || '',
                    gradingNotes: answer_key?.gradingNotes || ''
                };
            }

            const question = await db.CbtQuestion.create({
                question_bank_id: bankId,
                question_type,
                question_text,
                media_url,
                difficulty,
                default_score,
                answer_key: finalAnswerKey,
                explanation,
                status: 'DRAFT', // Default is DRAFT for new question
                created_by: userId,
            }, { transaction });

            if (formattedOptions.length > 0) {
                const optionsToCreate = formattedOptions.map(opt => ({
                    ...opt, question_id: question.id
                }));
                await db.CbtQuestionOption.bulkCreate(optionsToCreate, { transaction });
            }

            await transaction.commit();
            return this.findById(bankId, question.id, userId, true);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async update(bankId, questionId, payload, userId, hasViewAllAccess) {
        const {
            question_type, question_text, media_url, difficulty = 'MEDIUM',
            default_score = 1.0, answer_key, explanation, options
        } = payload;

        if (default_score < 0) {
            throw new Error('Bobot tidak valid. Harus lebih besar dari atau sama dengan nol.');
        }

        // We check valid rules for this specific creation type before moving into TX
        this._validateTypeSpecifics(question_type, options, answer_key);

        const transaction = await db.sequelize.transaction();

        try {
            await this._checkPermissionAndLockBank(bankId, userId, hasViewAllAccess, transaction);

            const question = await db.CbtQuestion.findOne({
                where: { id: questionId, question_bank_id: bankId },
                transaction
            });

            if (!question) throw new Error('Soal tidak ditemukan.');

            const typeChanged = question.question_type !== question_type;

            let formattedOptions = [];
            if (['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(question_type)) {
                const keys = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                formattedOptions = options.map((opt, i) => ({
                    option_key: keys[i] || `O${i}`,
                    option_text: opt.option_text,
                    media_url: opt.media_url || null,
                    is_correct: opt.is_correct === true,
                    sort_order: i
                }));
            } else if (question_type === 'TRUE_FALSE') {
                formattedOptions = [
                    { option_key: 'A', option_text: 'Benar', sort_order: 0, is_correct: !!options[0]?.is_correct },
                    { option_key: 'B', option_text: 'Salah', sort_order: 1, is_correct: !!options[1]?.is_correct }
                ];
            }

            // Cleanup answer keys
            let finalAnswerKey = null;
            if (question_type === 'SHORT_ANSWER') {
                let accepted = answer_key.acceptedAnswers.map(a => typeof a === 'string' ? a.trim() : '').filter(a => a !== '');
                accepted = [...new Set(accepted)];

                finalAnswerKey = {
                    acceptedAnswers: accepted,
                    caseSensitive: answer_key.caseSensitive === true,
                    trimWhitespace: answer_key.trimWhitespace !== false
                };
            } else if (question_type === 'ESSAY') {
                finalAnswerKey = {
                    modelAnswer: answer_key?.modelAnswer || '',
                    gradingNotes: answer_key?.gradingNotes || ''
                };
            }

            // Update main question properties
            await question.update({
                question_type,
                question_text,
                media_url,
                difficulty,
                default_score,
                answer_key: finalAnswerKey,
                explanation,
                updated_by: userId
            }, { transaction });

            // Hard replace options for simplicity and to handle "cleaning old type options" or deletions. 
            // In CBT systems, since foreign keys are strictly checked only on Exam snapshots,
            // destroying un-taken options on draft is generally safe.
            await db.CbtQuestionOption.destroy({
                where: { question_id: question.id },
                transaction
            });

            if (formattedOptions.length > 0) {
                const optionsToCreate = formattedOptions.map(opt => ({
                    ...opt, question_id: question.id
                }));
                await db.CbtQuestionOption.bulkCreate(optionsToCreate, { transaction });
            }

            // If it was ACTIVE, and you changed it to an invalid state, it is prevented by validation earlier. 
            // So status remains unchanged.

            await transaction.commit();
            return this.findById(bankId, question.id, userId, true);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async updateStatus(bankId, questionId, status, userId, hasViewAllAccess) {
        if (!['ACTIVE', 'ARCHIVED', 'DRAFT'].includes(status)) {
            throw new Error('Status tidak valid.');
        }

        const transaction = await db.sequelize.transaction();

        try {
            await this._checkPermissionAndLockBank(bankId, userId, hasViewAllAccess, transaction);
            const question = await db.CbtQuestion.findOne({
                where: { id: questionId, question_bank_id: bankId },
                include: [{ model: db.CbtQuestionOption, as: 'options' }],
                transaction
            });

            if (!question) throw new Error('Soal tidak ditemukan.');

            // Validate constraints before activating
            if (status === 'ACTIVE') {
                this._validateTypeSpecifics(question.question_type, question.options, question.answer_key);
            }

            question.status = status;
            question.updated_by = userId;
            await question.save({ transaction });

            await transaction.commit();
            return question;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    async bulkUpdateStatus(bankId, questionIds, status, userId, hasViewAllAccess) {
        // Bulk logic omitted if single is preferred, but easy to implement iteratively
        const results = [];
        for (let id of questionIds) {
            try {
                const updated = await this.updateStatus(bankId, id, status, userId, hasViewAllAccess);
                results.push({ id, status: 'success' });
            } catch (err) {
                results.push({ id, status: 'failed', reason: err.message });
            }
        }
        return results;
    }

    async duplicate(bankId, questionId, userId, hasViewAllAccess) {
        const transaction = await db.sequelize.transaction();

        try {
            await this._checkPermissionAndLockBank(bankId, userId, hasViewAllAccess, transaction);

            const question = await db.CbtQuestion.findOne({
                where: { id: questionId, question_bank_id: bankId },
                include: [{ model: db.CbtQuestionOption, as: 'options' }],
                transaction
            });

            if (!question) throw new Error('Soal sumber tidak ditemukan.');

            // Duplicate Question
            const newQuestion = await db.CbtQuestion.create({
                question_bank_id: question.question_bank_id,
                question_type: question.question_type,
                question_text: question.question_text, // Add "Salinan"? Specs says: Tambahkan penanda seperti “Salinan” hanya jika diperlukan agar mudah dibedakan. Let's do it.
                media_url: question.media_url,
                difficulty: question.difficulty,
                default_score: question.default_score,
                answer_key: question.answer_key,
                explanation: question.explanation,
                status: 'DRAFT',
                created_by: userId
            }, { transaction });

            if (question.options && question.options.length > 0) {
                const copiedOptions = question.options.map(opt => ({
                    question_id: newQuestion.id,
                    option_key: opt.option_key,
                    option_text: opt.option_text,
                    media_url: opt.media_url,
                    is_correct: opt.is_correct,
                    sort_order: opt.sort_order
                }));
                await db.CbtQuestionOption.bulkCreate(copiedOptions, { transaction });
            }

            await transaction.commit();

            // Add (Salinan) string post-find to UI, but actually we should just add it to text directly 
            newQuestion.question_text = `(Salinan) ${newQuestion.question_text}`;
            await newQuestion.save({ silent: true }); // Outside of transaction

            return this.findById(bankId, newQuestion.id, userId, true);
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

}

module.exports = new CbtQuestionService();
