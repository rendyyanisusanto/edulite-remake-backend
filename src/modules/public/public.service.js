const { 
    Student, 
    StudentClassHistory,
    Class, 
    StudentDailyAttendance,
    StudentToiletPermission,
    StudentViolation,
    ViolationType,
    PermissionLetterStudent,
    PermissionLetter,
    StudentPositivePoint,
    PositivePointType
} = require('../../models');
const { Op } = require('sequelize');

exports.getStudentDashboard = async (studentId, date) => {
    // 1. Fetch Student
    const student = await Student.findOne({
        where: { id: studentId }
    });

    if (!student) return null;

    // Get latest class history for the student
    const classHistory = await StudentClassHistory.findOne({
        where: { student_id: studentId },
        order: [['id', 'DESC']],
        include: [{ model: Class, as: 'class_info' }]
    });

    // 2. Fetch Data
    const attendance = await StudentDailyAttendance.findOne({
        where: { student_id: studentId, attendance_date: date }
    });

    const toiletPermissions = await StudentToiletPermission.findAll({
        where: { student_id: studentId, permission_date: date },
        order: [['exit_at', 'ASC']]
    });

    const violations = await StudentViolation.findAll({
        where: { student_id: studentId, date: date },
        include: [{ model: ViolationType, as: 'type' }],
        order: [['created_at', 'ASC']]
    });

    const permissions = await PermissionLetterStudent.findAll({
        where: { student_id: studentId },
        include: [
            { 
                model: PermissionLetter, 
                as: 'permission_letter',
                where: {
                    start_date: { [Op.lte]: date },
                    end_date: { [Op.gte]: date },
                    status: 'APPROVED'
                }
            }
        ]
    });

    const positiveNotes = await StudentPositivePoint.findAll({
        where: { student_id: studentId, date: date },
        include: [{ model: PositivePointType, as: 'type' }],
        order: [['created_at', 'ASC']]
    });

    // 3. Build Timeline
    const timeline = [];

    if (attendance) {
        if (attendance.clock_in_at) {
            timeline.push({
                time: attendance.clock_in_at,
                title: 'Datang ke Sekolah',
                type: 'attendance_in',
                icon: '✅',
                details: `Jam Masuk: ${formatTime(attendance.clock_in_at)}`
            });
        }
        if (attendance.clock_out_at) {
            timeline.push({
                time: attendance.clock_out_at,
                title: 'Pulang Sekolah',
                type: 'attendance_out',
                icon: '👋',
                details: `Jam Pulang: ${formatTime(attendance.clock_out_at)}`
            });
        }
    }

    toiletPermissions.forEach(tp => {
        if (tp.exit_at) {
            timeline.push({
                time: tp.exit_at,
                title: 'Izin Toilet',
                type: 'toilet_out',
                icon: '🚻',
                details: `Keluar: ${formatTime(tp.exit_at)}`
            });
        }
        if (tp.return_at) {
            timeline.push({
                time: tp.return_at,
                title: 'Kembali ke Kelas (Toilet)',
                type: 'toilet_in',
                icon: '🚻',
                details: `Kembali: ${formatTime(tp.return_at)} - Durasi: ${tp.duration_minutes} mnt`
            });
        }
    });

    violations.forEach(v => {
        timeline.push({
            time: v.createdAt || v.date, // use createdAt if available, else fallback
            title: v.type ? v.type.name : 'Pelanggaran',
            type: 'violation',
            icon: '⚠',
            details: v.description
        });
    });

    permissions.forEach(p => {
        timeline.push({
            time: p.createdAt || p.permission_letter.start_date, 
            title: p.permission_letter.activity_name || 'Perizinan',
            type: 'permission',
            icon: '📄',
            details: p.permission_letter.purpose
        });
    });

    positiveNotes.forEach(pn => {
        timeline.push({
            time: pn.createdAt || pn.date,
            title: pn.type ? pn.type.name : 'Catatan Positif',
            type: 'positive_note',
            icon: '⭐',
            details: pn.description
        });
    });

    // Sort timeline by time ascending
    timeline.sort((a, b) => new Date(a.time) - new Date(b.time));

    // Format time for timeline items for frontend consistency
    timeline.forEach(item => {
        item.formatted_time = formatTime(item.time);
    });

    // 4. Build Summary
    const summary = {
        attendance: attendance ? (attendance.clock_out_at ? 'Sudah Pulang' : (attendance.clock_in_at ? 'Sedang di Sekolah' : 'Belum Hadir')) : 'Belum Hadir',
        toilet_count: toiletPermissions.length,
        violation_count: violations.length,
        permission_count: permissions.length,
        positive_note_count: positiveNotes.length,
        last_updated: formatTime(new Date())
    };

    return {
        student: {
            id: student.id,
            name: student.full_name || student.name, // in DB it's full_name
            nis: student.nis,
            photo: student.photo,
            class_name: classHistory && classHistory.class_info ? classHistory.class_info.name : '-'
        },
        summary,
        attendance: attendance ? {
            status: attendance.attendance_status,
            clock_in: formatTime(attendance.clock_in_at),
            clock_out: formatTime(attendance.clock_out_at),
            late_minutes: attendance.late_minutes
        } : null,
        toilet_permissions: toiletPermissions.map(tp => ({
            exit_at: formatTime(tp.exit_at),
            return_at: formatTime(tp.return_at),
            duration: tp.duration_minutes
        })),
        violations: violations.map(v => ({
            time: formatTime(v.createdAt || v.date),
            category: v.type ? v.type.name : '-',
            points: v.type ? v.type.point : 0,
            description: v.description
        })),
        permissions: permissions.map(p => ({
            type: p.permission_letter.activity_name,
            start_date: p.permission_letter.start_date,
            end_date: p.permission_letter.end_date,
            status: p.permission_letter.status,
            reason: p.permission_letter.purpose
        })),
        positive_notes: positiveNotes.map(pn => ({
            time: formatTime(pn.createdAt || pn.date),
            category: pn.type ? pn.type.name : '-',
            points: pn.points,
            description: pn.description
        })),
        timeline
    };
};

function formatTime(dateString) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; // fallback if invalid
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
}
