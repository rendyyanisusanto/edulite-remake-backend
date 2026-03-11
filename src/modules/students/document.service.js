const { StudentDocument, Student } = require('../../models');

class StudentDocumentService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const docs = await StudentDocument.findAndCountAll({
            include: [{ model: Student, as: 'student', attributes: ['id', 'nis', 'full_name'] }],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            totalItems: docs.count,
            documents: docs.rows,
            totalPages: Math.ceil(docs.count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const doc = await StudentDocument.findByPk(id, {
            include: [{ model: Student, as: 'student' }]
        });
        if (!doc) throw new Error(`Document with id ${id} not found`);
        return doc;
    }

    async create(data) {
        // Here we could add MinIO logic to upload the file and get the URL
        // but for now we expect `file_url` to be passed or handled in controller
        return await StudentDocument.create(data);
    }

    async update(id, data) {
        const doc = await this.findById(id);
        return await doc.update(data);
    }

    async delete(id) {
        const doc = await this.findById(id);
        return await doc.destroy();
    }
}

module.exports = new StudentDocumentService();
