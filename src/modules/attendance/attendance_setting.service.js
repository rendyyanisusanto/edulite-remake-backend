'use strict';
const { AttendanceSetting, AttendanceShift, User } = require('../../models');

class AttendanceSettingService {
    async getCurrent() {
        const setting = await AttendanceSetting.findOne({
            where: { is_active: true },
            include: [
                { model: AttendanceShift, as: 'active_shift', attributes: ['id', 'name', 'clock_in_start', 'clock_in_end'] },
                { model: User, as: 'updater', attributes: ['id', 'name'] }
            ],
            order: [['updated_at', 'DESC']]
        });
        return setting;
    }

    async upsert(data, userId) {
        const {
            name, center_lat, center_lng, radius_meters,
            allow_outside_radius, require_selfie, require_note_outside_radius,
            min_gps_accuracy_meters, clock_in_tolerance_minutes, clock_out_tolerance_minutes,
            active_shift_id
        } = data;

        if (center_lat == null || center_lng == null) throw new Error('Center coordinates are required');
        if (!radius_meters) throw new Error('Radius is required');

        const existing = await AttendanceSetting.findOne({ where: { is_active: true }, order: [['id', 'ASC']] });

        const payload = {
            name: name || 'Default Setting',
            center_lat, center_lng, radius_meters,
            allow_outside_radius: !!allow_outside_radius,
            require_selfie: !!require_selfie,
            require_note_outside_radius: require_note_outside_radius !== false,
            min_gps_accuracy_meters: min_gps_accuracy_meters || 100,
            clock_in_tolerance_minutes: clock_in_tolerance_minutes || 0,
            clock_out_tolerance_minutes: clock_out_tolerance_minutes || 0,
            active_shift_id: active_shift_id || null,
            updated_by: userId
        };

        if (existing) {
            await existing.update(payload);
            return await this.getCurrent();
        }

        await AttendanceSetting.create({ ...payload, is_active: true });
        return await this.getCurrent();
    }
}

module.exports = new AttendanceSettingService();
