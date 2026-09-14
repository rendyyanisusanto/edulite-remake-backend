const { StudentDailyAttendance, StudentTahfidzAttendance, Student, Class, StudentClassHistory, AcademicYear } = require('../../models');
const { Op } = require('sequelize');

class StudentAttendanceReportService {
    /**
     * Get matrix format recap report
     */
    async getRecapMatrix(params = {}) {
        const { startDate, endDate, class_id, compare_tahfidz } = params;

        if (!startDate || !endDate) {
            throw new Error('startDate dan endDate harus diisi');
        }

        // Generate date array between startDate and endDate
        const dates = [];
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        while (currentDate <= end) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Fetch students and their class info
        const studentInclude = [
            {
                model: StudentClassHistory,
                as: 'class_history',
                required: true,
                include: [
                    {
                        model: Class,
                        as: 'class_info',
                        attributes: ['id', 'name']
                    }
                ],
                order: [['created_at', 'DESC']]
            }
        ];

        // Ensure we only get students from the active academic year
        const activeYear = await AcademicYear.findOne({ where: { is_active: true } });
        
        studentInclude[0].where = {};
        
        if (activeYear) {
            studentInclude[0].where.academic_year_id = activeYear.id;
        }

        if (class_id) {
            studentInclude[0].where.class_id = class_id;
        }

        const students = await Student.findAll({
            attributes: ['id', 'full_name', 'nis'],
            include: studentInclude,
            order: [
                [{ model: StudentClassHistory, as: 'class_history' }, { model: Class, as: 'class_info' }, 'name', 'ASC'],
                ['full_name', 'ASC']
            ]
        });

        const studentIds = students.map(s => s.id);

        // Fetch regular school attendance from daily attendances (RFID system)
        const attendances = await StudentDailyAttendance.findAll({
            where: {
                student_id: { [Op.in]: studentIds },
                attendance_date: { [Op.between]: [startDate, endDate] }
            },
            attributes: ['student_id', 'attendance_date', 'attendance_status']
        });

        // Map school attendance by student_id and date
        const attendanceMap = {};
        attendances.forEach(att => {
            if (!attendanceMap[att.student_id]) {
                attendanceMap[att.student_id] = {};
            }
            attendanceMap[att.student_id][att.attendance_date] = att.attendance_status;
        });

        let tahfidzMap = {};
        let tahfidzActiveDates = new Set();

        if (compare_tahfidz === 'true' || compare_tahfidz === true) {
            // Fetch tahfidz attendance
            const tahfidzAttendances = await StudentTahfidzAttendance.findAll({
                where: {
                    attendance_date: { [Op.between]: [startDate, endDate] }
                },
                attributes: ['student_id', 'attendance_date', 'status']
            });

            // Mark dates that have at least one tahfidz attendance as "active tahfidz dates"
            tahfidzAttendances.forEach(att => {
                tahfidzActiveDates.add(att.attendance_date);
            });

            // Map tahfidz attendance
            tahfidzAttendances.forEach(att => {
                if (!tahfidzMap[att.student_id]) {
                    tahfidzMap[att.student_id] = {};
                }
                tahfidzMap[att.student_id][att.attendance_date] = att.status;
            });
        }

        const mapStatusToCode = (status) => {
            const s = status.toUpperCase();
            if (s === 'PRESENT' || s === 'LATE' || s === 'HADIR' || s === 'TERLAMBAT') return 'H';
            if (s === 'PERMISSION' || s === 'IZIN') return 'I';
            if (s === 'SICK' || s === 'SAKIT') return 'S';
            if (s === 'ABSENT' || s === 'ALPA') return 'A';
            return '-';
        };

        const resultStudents = students.map(student => {
            const classInfo = student.class_history?.[0]?.class_info;
            
            const attendanceMatrix = {};
            dates.forEach(date => {
                const schoolStatus = attendanceMap[student.id]?.[date];
                let displayStatus = schoolStatus ? mapStatusToCode(schoolStatus) : '-';
                
                if (compare_tahfidz === 'true' || compare_tahfidz === true) {
                    if (displayStatus === 'H') {
                        // Check tahfidz
                        const isTahfidzActive = tahfidzActiveDates.has(date);
                        if (isTahfidzActive) {
                            const tahfidzStatus = tahfidzMap[student.id]?.[date];
                            if (tahfidzStatus === 'present') {
                                displayStatus = 'H';
                            } else {
                                displayStatus = 'HA';
                            }
                        }
                    }
                }
                attendanceMatrix[date] = displayStatus;
            });

            return {
                id: student.id,
                full_name: student.full_name,
                nis: student.nis,
                class_name: classInfo ? classInfo.name : 'Unknown Class',
                attendances: attendanceMatrix
            };
        });

        return {
            dates,
            students: resultStudents
        };
    }
}

module.exports = new StudentAttendanceReportService();
