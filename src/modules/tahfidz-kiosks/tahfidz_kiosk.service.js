const { TahfidzKiosk, Class } = require('../../models');
const crypto = require('crypto');

class TahfidzKioskService {
    /**
     * Get all kiosks with class info
     */
    async getAll() {
        const classes = await Class.findAll({
            order: [['name', 'ASC']]
        });
        
        const kiosks = await TahfidzKiosk.findAll();
        const kioskMap = new Map();
        for (const kiosk of kiosks) {
            kioskMap.set(kiosk.class_id, kiosk);
        }

        return classes.map(c => {
            const kiosk = kioskMap.get(c.id);
            return {
                class_id: c.id,
                class_name: c.name,
                has_kiosk: !!kiosk,
                kiosk_id: kiosk ? kiosk.id : null,
                token: kiosk ? kiosk.token : null,
                is_active: kiosk ? kiosk.is_active : false
            };
        });
    }

    /**
     * Get kiosk by class id
     */
    async getByClassId(classId) {
        return TahfidzKiosk.findOne({
            where: { class_id: classId },
            include: [
                {
                    model: Class,
                    as: 'class_info',
                    attributes: ['id', 'name']
                }
            ]
        });
    }

    /**
     * Generate or regenerate token for a class
     */
    async generateToken(classId, user) {
        const token = crypto.randomBytes(32).toString('hex');
        
        let kiosk = await TahfidzKiosk.findOne({ where: { class_id: classId } });
        
        if (kiosk) {
            kiosk.token = token;
            kiosk.updated_by = user?.name || 'System';
            await kiosk.save();
        } else {
            kiosk = await TahfidzKiosk.create({
                class_id: classId,
                token: token,
                is_active: true,
                created_by: user?.name || 'System',
                updated_by: user?.name || 'System'
            });
        }
        
        return this.getByClassId(classId);
    }

    /**
     * Toggle active status
     */
    async toggleActive(id, user) {
        const kiosk = await TahfidzKiosk.findByPk(id);
        if (!kiosk) {
            throw new Error('Kiosk tidak ditemukan');
        }
        
        kiosk.is_active = !kiosk.is_active;
        kiosk.updated_by = user?.name || 'System';
        await kiosk.save();
        
        return kiosk;
    }
}

module.exports = new TahfidzKioskService();
