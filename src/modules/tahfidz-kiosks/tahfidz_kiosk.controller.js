const tahfidzKioskService = require('./tahfidz_kiosk.service');
const { Class } = require('../../models');

class TahfidzKioskController {
    async getAll(req, res) {
        try {
            const kiosks = await tahfidzKioskService.getAll();
            
            // We also need to get all classes so the frontend can generate kiosks for classes that don't have one yet.
            const classes = await Class.findAll({
                order: [['name', 'ASC']],
                attributes: ['id', 'name']
            });

            // Merge them
            const data = classes.map(c => {
                const kiosk = kiosks.find(k => k.class_id === c.id);
                return {
                    class_id: c.id,
                    class_name: c.name,
                    kiosk_id: kiosk ? kiosk.id : null,
                    token: kiosk ? kiosk.token : null,
                    is_active: kiosk ? kiosk.is_active : false,
                    has_kiosk: !!kiosk
                };
            });

            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async generateToken(req, res) {
        try {
            const { class_id } = req.body;
            if (!class_id) {
                return res.status(400).json({ success: false, message: 'class_id is required' });
            }

            const kiosk = await tahfidzKioskService.generateToken(class_id, req.user);
            res.status(200).json({ success: true, data: kiosk, message: 'Token generated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async toggleActive(req, res) {
        try {
            const { id } = req.params;
            const kiosk = await tahfidzKioskService.toggleActive(id, req.user);
            res.status(200).json({ success: true, data: kiosk, message: `Kiosk is now ${kiosk.is_active ? 'active' : 'inactive'}` });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new TahfidzKioskController();
