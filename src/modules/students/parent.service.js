const { ParentProfile, Student } = require('../../models');

class ParentProfileService {
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const offset = (page - 1) * limit;

        const parents = await ParentProfile.findAndCountAll({
            include: [{ model: Student, as: 'student', attributes: ['id', 'nis', 'full_name'] }],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return {
            totalItems: parents.count,
            parents: parents.rows,
            totalPages: Math.ceil(parents.count / limit),
            currentPage: page
        };
    }

    async findById(id) {
        const parent = await ParentProfile.findByPk(id, {
            include: [{ model: Student, as: 'student' }]
        });
        if (!parent) throw new Error(`Parent with id ${id} not found`);
        return parent;
    }

    async create(data) {
        return await ParentProfile.create(data);
    }

    async update(id, data) {
        const parent = await this.findById(id);
        return await parent.update(data);
    }

    async delete(id) {
        const parent = await this.findById(id);
        return await parent.destroy();
    }
}

module.exports = new ParentProfileService();
