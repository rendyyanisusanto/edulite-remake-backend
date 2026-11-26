'use strict';

/**
 * IntegratedDailyAttendanceAnalysisService (LA-06)
 *
 * Pure, side-effect-free cross-check engine. It never reads from or writes to the
 * database, never creates a BOLOS status, never creates violation records/points,
 * and never converts "not recorded" into ALPA. Every result is a structured finding
 * that requires human verification.
 *
 * Student input shape (built by IntegratedDailyReportService):
 *   gate:     { record, source_error, clock_in, clock_out, clock_in_min, clock_out_min, entry_status,
 *               exit_status, attendance_status, late_minutes, display_status, class_mismatch,
 *               shift: { name, clock_out_start_min, clock_out_end_min, allow_checkout, config_reliable } | null,
 *               record_id }
 *   tahfidz:  { record, source_error, status, display_status, class_mismatch, record_id }
 *   lessons:  [{ period_number, status, start_min, end_min, period_start_time, period_end_time,
 *                subject_name, teacher_name, session_id, permission_covered, permission_label }]
 *   permissions: [{ kind, label, whole_day, start_min, end_min }]
 *   other_class_lessons: number
 */

const {
    analyzeStudentDailySequence,
    groupConsecutiveEpisodes,
    formatEpisodes,
    PRESENT_STATUSES
} = require('./lesson-attendance-truancy.helper');

const CATEGORY = {
    POTENTIAL_VIOLATION: 'POTENTIAL_VIOLATION',
    INCONSISTENCY: 'INCONSISTENCY',
    INCOMPLETE_DATA: 'INCOMPLETE_DATA'
};

const FINDING_CODES = [
    'LESSON_PRESENT_TAHFIDZ_NOT_RECORDED',
    'TAHFIDZ_ABSENT_LESSON_PRESENT',
    'GATE_PRESENT_TAHFIDZ_ABSENT',
    'LESSON_PRESENT_GATE_NOT_RECORDED',
    'TAHFIDZ_PRESENT_GATE_NOT_RECORDED',
    'POTENTIAL_LESSON_TRUANCY',
    'ABSENT_AFTER_LAST_PRESENCE',
    'ABSENT_AT_START',
    'GATE_PRESENT_ALL_LESSONS_ABSENT',
    'POTENTIAL_EARLY_DEPARTURE',
    'GATE_CHECKOUT_NOT_RECORDED',
    'GATE_LATE_ENTRY',
    'CROSS_ATTENDANCE_STATUS_CONFLICT',
    'ALL_ATTENDANCE_NOT_RECORDED',
    'APPROVED_PERMISSION_ABSENT_CONFLICT'
];

const FINDING_CATEGORIES = Object.values(CATEGORY);

const NON_PRESENCE_GAP = new Set(['NOT_RECORDED', 'MISSING_DETAIL', 'CANCELLED', 'UPCOMING']);

const toHm = (min) => {
    if (min === null || min === undefined) return '-';
    const h = String(Math.floor(min / 60)).padStart(2, '0');
    const m = String(min % 60).padStart(2, '0');
    return `${h}:${m}`;
};

const rangeLabel = (cells, predicate) => formatEpisodes(groupConsecutiveEpisodes(cells, predicate));

const cellByPeriod = (cells, pn) => cells.find((c) => Number(c.period_number) === Number(pn));

function describeSubjects(cells, periods) {
    const parts = [];
    for (const pn of periods) {
        const c = cellByPeriod(cells, pn);
        if (c && (c.subject_name || c.teacher_name)) {
            parts.push(`J${pn} ${c.subject_name || '-'}${c.teacher_name ? ` (${c.teacher_name})` : ''}`);
        }
    }
    return parts.join('; ');
}

function timeSpan(cells, periods) {
    if (!periods.length) return '';
    const first = cellByPeriod(cells, periods[0]);
    const last = cellByPeriod(cells, periods[periods.length - 1]);
    if (!first || !last || !first.period_start_time || !last.period_end_time) return '';
    return `${first.period_start_time}–${last.period_end_time}`;
}

class IntegratedDailyAttendanceAnalysisService {
    /**
     * @returns {{ findings: Array, analysis: object }}
     */
    analyzeStudent(st, ctx) {
        const findings = [];
        const src = ctx.sources || { gate: true, tahfidz: true, lesson: true };
        const gate = st.gate || {};
        const thf = st.tahfidz || {};
        const permissions = st.permissions || [];
        const rawCells = st.lessons || [];

        const push = (f) => findings.push({
            affected_periods: [],
            evidence: [],
            source_module: [],
            source_record_ids: {},
            related_codes: [],
            verification_required: f.category !== CATEGORY.INCOMPLETE_DATA,
            ...f
        });

        // Approved permission covering an ALPA cell: keep the original status in the matrix,
        // but exclude it from violation detection (neutral for sequence analysis).
        const seq = rawCells.map((c) => (
            c.status === 'ALPA' && c.permission_covered ? { ...c, status: 'PERMITTED_ALPA' } : c
        ));
        const lessonOk = src.lesson !== false;
        const analysis = analyzeStudentDailySequence(lessonOk ? seq : []);

        const isPresent = (c) => PRESENT_STATUSES.has(c.status);
        const presentCells = lessonOk ? seq.filter(isPresent) : [];
        const presentLabel = presentCells.length ? rangeLabel(seq, isPresent) : '';
        const hasLessonPresence = presentCells.length > 0;

        const gateOk = src.gate !== false && !gate.source_error;
        const thfOk = src.tahfidz !== false && !thf.source_error;
        const hasGateEntry = gateOk && gate.clock_in_min !== null && gate.clock_in_min !== undefined;
        const hasGateExit = gateOk && gate.clock_out_min !== null && gate.clock_out_min !== undefined;
        const gateStatusCode = gate.display_status || null;
        const gateExplicitStatus = ['I', 'S', 'A'].includes(gateStatusCode);
        const wholeDayLeave = permissions.some((p) => p.whole_day);
        const coversMinute = (min) => permissions.some(
            (p) => p.whole_day || (p.start_min !== null && p.end_min !== null && min >= p.start_min - 30 && min <= p.end_min)
        );
        const gateIds = gate.record_id ? { gate: [gate.record_id] } : {};
        const thfIds = thf.record_id ? { tahfidz: [thf.record_id] } : {};
        const lessonIds = (periods) => {
            const ids = periods.map((pn) => cellByPeriod(seq, pn)?.session_id).filter(Boolean);
            return ids.length ? { lesson_sessions: ids } : {};
        };
        const gateEvidence = hasGateEntry ? `Masuk sekolah pukul ${gate.clock_in}.` : null;

        // ---- Rule 13: late entry ------------------------------------------------------
        if (hasGateEntry && !wholeDayLeave) {
            const late = Number(gate.late_minutes) > 0 ||
                String(gate.entry_status || '').toUpperCase() === 'LATE' ||
                String(gate.attendance_status || '').toUpperCase() === 'LATE';
            if (late) {
                const mins = Number(gate.late_minutes) > 0 ? `terlambat ${gate.late_minutes} menit` : 'tercatat terlambat';
                push({
                    finding_code: 'GATE_LATE_ENTRY',
                    category: CATEGORY.POTENTIAL_VIOLATION,
                    title: 'Terlambat masuk sekolah',
                    description: `Masuk sekolah pukul ${gate.clock_in}, ${mins}.`,
                    evidence: [`Status masuk gerbang: ${gate.entry_status || gate.attendance_status || '-'}.`],
                    source_module: ['GATE'],
                    source_record_ids: gateIds
                });
            }
        }

        // ---- Rule 12: checkout not recorded -------------------------------------------
        if (hasGateEntry && !hasGateExit && ctx.gateHasAnyExit !== false && gate.shift && gate.shift.config_reliable &&
            gate.shift.allow_checkout && gate.shift.clock_out_end_min !== null &&
            gate.shift.clock_out_end_min !== undefined) {
            const windowEnded = ctx.isToday ? ctx.currentMin > gate.shift.clock_out_end_min : true;
            if (windowEnded) {
                push({
                    finding_code: 'GATE_CHECKOUT_NOT_RECORDED',
                    category: CATEGORY.INCONSISTENCY,
                    title: 'Presensi pulang tidak tercatat',
                    description: 'Presensi masuk tercatat, tetapi presensi pulang tidak tercatat.',
                    evidence: [
                        `Masuk sekolah pukul ${gate.clock_in}.`,
                        `Shift ${gate.shift.name || '-'} mengizinkan presensi pulang sampai ${toHm(gate.shift.clock_out_end_min)}.`
                    ],
                    source_module: ['GATE'],
                    source_record_ids: gateIds
                });
            }
        }

        // ---- Rule 11: early departure -------------------------------------------------
        let earlyDeparture = null;
        if (hasGateExit) {
            const shift = gate.shift;
            const shiftKnown = shift && shift.config_reliable && shift.clock_out_start_min !== null &&
                shift.clock_out_start_min !== undefined;
            const statusEarly = /EARLY/i.test(String(gate.exit_status || ''));
            const timeEarly = shiftKnown && gate.clock_out_min < shift.clock_out_start_min;
            if ((timeEarly || statusEarly) && !coversMinute(gate.clock_out_min)) {
                const afterAbsent = seq
                    .filter((c) => c.status === 'ALPA' && c.start_min !== null && c.start_min >= gate.clock_out_min)
                    .map((c) => Number(c.period_number));
                const absLabel = afterAbsent.length
                    ? rangeLabel(seq, (c) => c.status === 'ALPA' && afterAbsent.includes(Number(c.period_number)))
                    : '';
                const schedule = shiftKnown
                    ? `, sebelum jadwal pulang pukul ${toHm(shift.clock_out_start_min)}`
                    : ', berstatus pulang lebih awal pada data gerbang';
                earlyDeparture = {
                    finding_code: 'POTENTIAL_EARLY_DEPARTURE',
                    category: CATEGORY.POTENTIAL_VIOLATION,
                    title: 'Pulang lebih awal',
                    description: `Tercatat pulang pukul ${gate.clock_out}${schedule}${absLabel ? `, dan ALPA pada ${absLabel}` : ''}.`,
                    affected_periods: afterAbsent,
                    related_codes: [],
                    evidence: [
                        ...(gateEvidence ? [gateEvidence] : []),
                        `Pulang pukul ${gate.clock_out}.`,
                        ...(shiftKnown ? [`Jadwal pulang (shift ${shift.name || '-'}): ${toHm(shift.clock_out_start_min)}.`] : []),
                        ...(absLabel ? [`ALPA pada ${absLabel}.`] : []),
                        'Tidak ditemukan izin pulang lebih awal yang relevan berdasarkan data yang tersedia.'
                    ],
                    source_module: ['GATE', ...(afterAbsent.length ? ['LESSON'] : [])],
                    source_record_ids: { ...gateIds, ...lessonIds(afterAbsent) }
                };
            }
        }

        // ---- Rule 04 / 05: gate entry not recorded (merged) --------------------------
        // Class-wide gate gaps (e.g. device outage) are a class warning, not per-student findings.
        if (gateOk && !hasGateEntry && !gateExplicitStatus && ctx.gateHasAnyRecord !== false) {
            const thfPresent = thfOk && thf.status === 'present';
            if (hasLessonPresence || thfPresent) {
                const what = [];
                if (thfPresent) what.push('hadir Tahfidz');
                if (hasLessonPresence) what.push(`${thfPresent ? '' : 'siswa '}hadir pada ${presentLabel}`.trim());
                const code = hasLessonPresence ? 'LESSON_PRESENT_GATE_NOT_RECORDED' : 'TAHFIDZ_PRESENT_GATE_NOT_RECORDED';
                const desc = hasLessonPresence
                    ? `Presensi masuk gerbang tidak tercatat, tetapi siswa ${thfPresent ? 'hadir Tahfidz dan ' : 'hadir pada '}${thfPresent ? presentLabel : presentLabel}.`
                    : 'Presensi masuk gerbang tidak tercatat, tetapi siswa hadir Tahfidz.';
                push({
                    finding_code: code,
                    category: CATEGORY.INCONSISTENCY,
                    title: 'Presensi masuk gerbang tidak tercatat',
                    description: desc,
                    affected_periods: presentCells.map((c) => Number(c.period_number)),
                    evidence: [
                        ...(thfPresent ? ['Tahfidz tercatat hadir.'] : []),
                        ...(hasLessonPresence ? [`Hadir pada ${presentLabel}.`] : []),
                        'Mungkin disebabkan presensi manual, koreksi, atau kendala perangkat RFID.'
                    ],
                    source_module: ['GATE', ...(thfPresent ? ['TAHFIDZ'] : []), ...(hasLessonPresence ? ['LESSON'] : [])],
                    source_record_ids: {
                        ...thfIds,
                        ...lessonIds(presentCells.map((c) => Number(c.period_number)))
                    }
                });
            }
        }

        // ---- Rule 02 / 03: Tahfidz absent --------------------------------------------
        if (thfOk && thf.status === 'absent') {
            const category = ctx.tahfidzApplicable ? CATEGORY.POTENTIAL_VIOLATION : CATEGORY.INCONSISTENCY;
            const basis = ctx.tahfidzApplicable
                ? 'Kegiatan Tahfidz berlangsung pada tanggal ini berdasarkan presensi kelas (jadwal resmi tidak tersedia di sistem).'
                : 'Jadwal dan kewajiban Tahfidz tidak dapat dipastikan karena belum ada siswa hadir Tahfidz di kelas ini.';
            if (wholeDayLeave) {
                push({
                    finding_code: 'APPROVED_PERMISSION_ABSENT_CONFLICT',
                    category: CATEGORY.INCONSISTENCY,
                    title: 'ALPA Tahfidz bertentangan dengan izin disetujui',
                    description: `Tercatat ALPA Tahfidz, tetapi terdapat izin yang disetujui (${permissions.filter((p) => p.whole_day).map((p) => p.label).join(', ')}).`,
                    evidence: ['Status asli Tahfidz dipertahankan; perlu pengecekan koreksi.'],
                    source_module: ['TAHFIDZ'],
                    source_record_ids: thfIds
                });
            } else if (hasLessonPresence) {
                push({
                    finding_code: 'TAHFIDZ_ABSENT_LESSON_PRESENT',
                    category,
                    title: 'ALPA Tahfidz, hadir mata pelajaran',
                    description: `Tercatat ALPA Tahfidz, tetapi hadir pada ${presentLabel}.`,
                    affected_periods: presentCells.map((c) => Number(c.period_number)),
                    evidence: [
                        ...(gateEvidence ? [gateEvidence] : ['Presensi masuk gerbang tidak tercatat.']),
                        `Hadir pada ${presentLabel}.`,
                        'Tahfidz tercatat ALPA.',
                        basis,
                        ...(hasGateEntry ? [] : [])
                    ],
                    source_module: ['TAHFIDZ', 'LESSON', ...(hasGateEntry ? ['GATE'] : [])],
                    source_record_ids: { ...thfIds, ...gateIds, ...lessonIds(presentCells.map((c) => Number(c.period_number))) }
                });
            } else if (hasGateEntry) {
                push({
                    finding_code: 'GATE_PRESENT_TAHFIDZ_ABSENT',
                    category,
                    title: 'Masuk sekolah, ALPA Tahfidz',
                    description: `Masuk sekolah pukul ${gate.clock_in}, tetapi tercatat ALPA Tahfidz.`,
                    evidence: [gateEvidence, 'Tahfidz tercatat ALPA.', basis, 'Waktu kegiatan Tahfidz tidak tersedia sehingga kehadiran saat kegiatan tidak dapat dipastikan.'],
                    source_module: ['GATE', 'TAHFIDZ'],
                    source_record_ids: { ...thfIds, ...gateIds }
                });
            }
        }

        // ---- Rule 01: lesson present, Tahfidz not recorded ----------------------------
        // Class-wide gaps are reported once as a class warning, not per student.
        if (thfOk && !thf.record && hasLessonPresence && ctx.tahfidzHasAnyRecord) {
            push({
                finding_code: 'LESSON_PRESENT_TAHFIDZ_NOT_RECORDED',
                category: CATEGORY.INCONSISTENCY,
                title: 'Presensi Tahfidz tidak tercatat',
                description: `Presensi Tahfidz tidak tercatat, tetapi siswa hadir pada ${presentLabel}.`,
                affected_periods: presentCells.map((c) => Number(c.period_number)),
                evidence: [
                    ...(gateEvidence ? [gateEvidence] : []),
                    `Hadir pada ${presentLabel}.`,
                    'Tidak ditemukan record Tahfidz pada tanggal yang sama.',
                    'Kewajiban dan status penyelesaian input Tahfidz tidak dapat dipastikan; diperlakukan sebagai ketidaksesuaian, bukan pelanggaran.'
                ],
                source_module: ['TAHFIDZ', 'LESSON'],
                source_record_ids: lessonIds(presentCells.map((c) => Number(c.period_number)))
            });
        }

        // ---- Rules 06 / 07 / 08: truancy episodes (LA-05 helper) ----------------------
        const truancySet = new Set(analysis.potential_truancy_periods);
        const truancyEpisodes = groupConsecutiveEpisodes(
            seq,
            (c) => c.status === 'ALPA' && truancySet.has(Number(c.period_number))
        );
        const truancyFindings = [];
        for (const ep of truancyEpisodes) {
            const firstIdx = seq.findIndex((c) => Number(c.period_number) === ep[0]);
            const lastIdx = seq.findIndex((c) => Number(c.period_number) === ep[ep.length - 1]);
            let lastPresentBefore = null;
            for (let i = firstIdx - 1; i >= 0; i -= 1) {
                if (isPresent(seq[i])) { lastPresentBefore = seq[i]; break; }
            }
            let returned = null;
            for (let i = lastIdx + 1; i < seq.length; i += 1) {
                if (isPresent(seq[i])) { returned = seq[i]; break; }
            }
            const epLabel = formatEpisodes([ep]);
            const nextCell = seq[lastIdx + 1];
            const gapNote = nextCell && NON_PRESENCE_GAP.has(nextCell.status)
                ? `Presensi J${nextCell.period_number} belum tercatat/tidak tersedia.`
                : null;
            const subjects = describeSubjects(seq, ep);
            const span = timeSpan(seq, ep);
            const evidence = [
                lastPresentBefore ? `Terakhir tercatat hadir pada J${lastPresentBefore.period_number} sebelum ALPA.` : null,
                `ALPA pada ${epLabel}${span ? ` (${span})` : ''}.`,
                subjects ? `Mata pelajaran: ${subjects}.` : null,
                returned ? `Kembali tercatat hadir pada J${returned.period_number}.` : 'Belum tercatat kembali hadir sampai jam terakhir yang tersedia.',
                gapNote
            ].filter(Boolean);
            if (returned) {
                truancyFindings.push({
                    finding_code: 'POTENTIAL_LESSON_TRUANCY',
                    category: CATEGORY.POTENTIAL_VIOLATION,
                    title: `Indikasi bolos ${epLabel}`,
                    description: `Indikasi bolos ${epLabel}, kembali tercatat hadir pada J${returned.period_number}.${gapNote ? ` ${gapNote}` : ''}`,
                    affected_periods: ep,
                    evidence,
                    source_module: ['LESSON'],
                    source_record_ids: lessonIds(ep)
                });
            } else {
                const lastPresentLabel = lastPresentBefore ? `J${lastPresentBefore.period_number}` : '-';
                truancyFindings.push({
                    finding_code: 'ABSENT_AFTER_LAST_PRESENCE',
                    category: CATEGORY.POTENTIAL_VIOLATION,
                    title: `Indikasi bolos ${epLabel}`,
                    description: `Terakhir tercatat hadir pada ${lastPresentLabel}, kemudian ALPA pada ${epLabel}.${gapNote ? ` ${gapNote}` : ''}`,
                    affected_periods: ep,
                    evidence,
                    source_module: ['LESSON'],
                    source_record_ids: lessonIds(ep),
                    _first_cell: seq[firstIdx]
                });
            }
        }

        // Merge episodes that start at/after recorded departure into the early-departure finding.
        const remainingTruancy = [];
        for (const tf of truancyFindings) {
            const startMin = tf._first_cell ? tf._first_cell.start_min : null;
            if (earlyDeparture && tf.finding_code === 'ABSENT_AFTER_LAST_PRESENCE' &&
                startMin !== null && startMin >= gate.clock_out_min) {
                earlyDeparture.related_codes.push('ABSENT_AFTER_LAST_PRESENCE');
                earlyDeparture.evidence.push(...tf.evidence.filter((e) => /^(Terakhir|Mata pelajaran)/.test(e)));
                continue;
            }
            const { _first_cell, ...clean } = tf;
            remainingTruancy.push(clean);
        }
        if (earlyDeparture) push(earlyDeparture);
        remainingTruancy.forEach(push);

        // ---- Rule 10 / 09: gate present but all absent / absent at start --------------
        if (analysis.all_recorded_periods_absent && hasGateEntry) {
            const total = (ctx.periods || []).length;
            const rec = analysis.summary.recorded_periods;
            const absLabel = rangeLabel(seq, (c) => c.status === 'ALPA');
            const thfPresent = thfOk && thf.status === 'present';
            push({
                finding_code: 'GATE_PRESENT_ALL_LESSONS_ABSENT',
                category: CATEGORY.POTENTIAL_VIOLATION,
                title: 'Masuk sekolah, ALPA seluruh jam tercatat',
                description: `Masuk sekolah pukul ${gate.clock_in}${thfPresent ? ' dan hadir Tahfidz' : ''}, tetapi ALPA pada seluruh jam pelajaran yang tercatat${rec < total ? ` (baru ${rec} dari ${total} jam tercatat)` : ''}.`,
                affected_periods: analysis.absent_periods,
                evidence: [
                    gateEvidence,
                    ...(thfPresent ? ['Tahfidz tercatat hadir.'] : []),
                    `ALPA pada ${absLabel}.`,
                    describeSubjects(seq, analysis.absent_periods) ? `Mata pelajaran: ${describeSubjects(seq, analysis.absent_periods)}.` : null,
                    rec < total ? 'Presensi sebagian jam belum lengkap sehingga kesimpulan sepanjang hari tidak dapat ditarik.' : null
                ].filter(Boolean),
                source_module: ['GATE', 'LESSON', ...(thfPresent ? ['TAHFIDZ'] : [])],
                source_record_ids: { ...gateIds, ...thfIds, ...lessonIds(analysis.absent_periods) }
            });
        } else if (analysis.absent_at_start && hasLessonPresence) {
            const startEps = groupConsecutiveEpisodes(
                seq,
                (c) => c.status === 'ALPA' && analysis.absent_at_start_periods.includes(Number(c.period_number))
            );
            const epLabel = formatEpisodes(startEps);
            const firstPresent = presentCells[0];
            const firstAbsent = cellByPeriod(seq, analysis.absent_at_start_periods[0]);
            const lastAbsent = cellByPeriod(seq, analysis.absent_at_start_periods[analysis.absent_at_start_periods.length - 1]);
            let desc;
            if (hasGateEntry && firstAbsent && firstAbsent.start_min !== null && gate.clock_in_min <= firstAbsent.start_min) {
                desc = `Sudah tercatat masuk sekolah pukul ${gate.clock_in}, tetapi ALPA pada ${epLabel}. Mulai tercatat hadir pada J${firstPresent.period_number}.`;
            } else if (hasGateEntry && lastAbsent && lastAbsent.end_min !== null && gate.clock_in_min >= lastAbsent.end_min) {
                desc = `ALPA pada ${epLabel} dan tercatat masuk sekolah setelah jam tersebut (pukul ${gate.clock_in}). Mulai tercatat hadir pada J${firstPresent.period_number}.`;
            } else {
                desc = `ALPA pada ${epLabel}, mulai tercatat hadir pada J${firstPresent.period_number}.`;
            }
            push({
                finding_code: 'ABSENT_AT_START',
                category: CATEGORY.POTENTIAL_VIOLATION,
                title: `ALPA jam awal ${epLabel}`,
                description: desc,
                affected_periods: analysis.absent_at_start_periods,
                evidence: [
                    ...(gateEvidence ? [gateEvidence] : ['Presensi masuk gerbang tidak tercatat.']),
                    `ALPA pada ${epLabel}.`,
                    describeSubjects(seq, analysis.absent_at_start_periods) ? `Mata pelajaran: ${describeSubjects(seq, analysis.absent_at_start_periods)}.` : null,
                    `Mulai tercatat hadir pada J${firstPresent.period_number}.`
                ].filter(Boolean),
                source_module: ['LESSON', ...(hasGateEntry ? ['GATE'] : [])],
                source_record_ids: { ...gateIds, ...lessonIds(analysis.absent_at_start_periods) }
            });
        }

        // ---- Rule 14: conflicts between sources ---------------------------------------
        if (hasLessonPresence) {
            if (gateOk && ['S', 'I'].includes(gateStatusCode)) {
                const word = gateStatusCode === 'S' ? 'SAKIT' : 'IZIN';
                push({
                    finding_code: 'CROSS_ATTENDANCE_STATUS_CONFLICT',
                    category: CATEGORY.INCONSISTENCY,
                    title: `Gerbang ${word}, hadir mata pelajaran`,
                    description: `Presensi gerbang tercatat ${word}, tetapi siswa tercatat hadir pada ${presentLabel}.`,
                    affected_periods: presentCells.map((c) => Number(c.period_number)),
                    evidence: [`Gerbang: ${word}.`, `Mapel: hadir pada ${presentLabel}.`, 'Periksa kemungkinan izin parsial, siswa kembali ke sekolah, atau kesalahan pencatatan.'],
                    source_module: ['GATE', 'LESSON'],
                    source_record_ids: { ...gateIds, ...lessonIds(presentCells.map((c) => Number(c.period_number))) }
                });
            }
            if (gateOk && gateStatusCode === 'A' && !hasGateEntry) {
                push({
                    finding_code: 'CROSS_ATTENDANCE_STATUS_CONFLICT',
                    category: CATEGORY.INCONSISTENCY,
                    title: 'Gerbang ALPA, hadir mata pelajaran',
                    description: `Presensi gerbang tercatat ALPA, tetapi siswa tercatat hadir pada ${presentLabel}.`,
                    affected_periods: presentCells.map((c) => Number(c.period_number)),
                    evidence: ['Gerbang: ALPA.', `Mapel: hadir pada ${presentLabel}.`],
                    source_module: ['GATE', 'LESSON'],
                    source_record_ids: { ...gateIds, ...lessonIds(presentCells.map((c) => Number(c.period_number))) }
                });
            }
            if (thfOk && ['sick', 'permission'].includes(thf.status)) {
                const word = thf.status === 'sick' ? 'sakit' : 'izin';
                push({
                    finding_code: 'CROSS_ATTENDANCE_STATUS_CONFLICT',
                    category: CATEGORY.INCONSISTENCY,
                    title: `Tahfidz ${word}, hadir mata pelajaran`,
                    description: `Tahfidz tercatat ${word}, tetapi siswa tercatat hadir pada ${presentLabel}.`,
                    affected_periods: presentCells.map((c) => Number(c.period_number)),
                    evidence: [`Tahfidz: ${word}.`, `Mapel: hadir pada ${presentLabel}.`],
                    source_module: ['TAHFIDZ', 'LESSON'],
                    source_record_ids: { ...thfIds, ...lessonIds(presentCells.map((c) => Number(c.period_number))) }
                });
            }
            if (hasGateExit) {
                const after = presentCells.filter((c) => c.start_min !== null && c.start_min > gate.clock_out_min);
                if (after.length) {
                    const first = after[0];
                    push({
                        finding_code: 'CROSS_ATTENDANCE_STATUS_CONFLICT',
                        category: CATEGORY.INCONSISTENCY,
                        title: 'Hadir mata pelajaran setelah jam pulang',
                        description: `Presensi pulang tercatat pukul ${gate.clock_out}, tetapi siswa tercatat ${first.status} pada J${first.period_number} pukul ${first.period_start_time}.`,
                        affected_periods: after.map((c) => Number(c.period_number)),
                        evidence: [`Pulang pukul ${gate.clock_out}.`, `Hadir pada ${formatEpisodes([after.map((c) => Number(c.period_number))])} (mulai ${first.period_start_time}).`, 'Periksa kemungkinan siswa kembali ke sekolah atau kesalahan pencatatan.'],
                        source_module: ['GATE', 'LESSON'],
                        source_record_ids: { ...gateIds, ...lessonIds(after.map((c) => Number(c.period_number))) }
                    });
                }
            }
        }
        if (hasGateEntry && hasGateExit && gate.clock_out_min < gate.clock_in_min) {
            push({
                finding_code: 'CROSS_ATTENDANCE_STATUS_CONFLICT',
                category: CATEGORY.INCONSISTENCY,
                title: 'Jam pulang sebelum jam masuk',
                description: `Jam pulang tercatat pukul ${gate.clock_out}, lebih awal daripada jam masuk pukul ${gate.clock_in}.`,
                evidence: [`Masuk ${gate.clock_in}; pulang ${gate.clock_out}.`],
                source_module: ['GATE'],
                source_record_ids: gateIds
            });
        }
        const mismatchSources = [];
        if (gate.class_mismatch) mismatchSources.push('gerbang');
        if (thf.class_mismatch) mismatchSources.push('Tahfidz');
        if (Number(st.other_class_lessons) > 0) mismatchSources.push('jam pelajaran');
        if (mismatchSources.length) {
            push({
                finding_code: 'CROSS_ATTENDANCE_STATUS_CONFLICT',
                category: CATEGORY.INCONSISTENCY,
                title: 'Presensi tercatat pada kelas berbeda',
                description: `Terdapat presensi ${mismatchSources.join(', ')} pada kelas berbeda dengan kelas laporan pada tanggal ini.`,
                evidence: ['Periksa penempatan kelas siswa dan transaksi sumber.'],
                source_module: [
                    ...(gate.class_mismatch ? ['GATE'] : []),
                    ...(thf.class_mismatch ? ['TAHFIDZ'] : []),
                    ...(Number(st.other_class_lessons) > 0 ? ['LESSON'] : [])
                ],
                source_record_ids: { ...gateIds, ...thfIds }
            });
        }

        // ---- Approved permission vs ALPA ----------------------------------------------
        const coveredAlpa = rawCells.filter((c) => c.status === 'ALPA' && c.permission_covered);
        if (coveredAlpa.length) {
            const periods = coveredAlpa.map((c) => Number(c.period_number));
            const label = formatEpisodes(groupConsecutiveEpisodes(rawCells, (c) => periods.includes(Number(c.period_number)) && c.status === 'ALPA'));
            const permLabels = [...new Set(coveredAlpa.map((c) => c.permission_label).filter(Boolean))];
            push({
                finding_code: 'APPROVED_PERMISSION_ABSENT_CONFLICT',
                category: CATEGORY.INCONSISTENCY,
                title: `ALPA ${label} bertentangan dengan izin disetujui`,
                description: `Tercatat ALPA pada ${label}, tetapi terdapat izin yang disetujui${permLabels.length ? ` (${permLabels.join('; ')})` : ''}.`,
                affected_periods: periods,
                evidence: ['Status asli ALPA dipertahankan dan tidak dihitung sebagai dugaan bolos.', 'Perlu pengecekan apakah presensi perlu dikoreksi melalui modul sumber.'],
                source_module: ['LESSON'],
                source_record_ids: lessonIds(periods)
            });
        }

        // ---- Rule 15: nothing recorded anywhere (data completeness) -------------------
        const noLessonDetail = lessonOk && !rawCells.some((c) => ['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'].includes(c.status));
        if (gateOk && thfOk && lessonOk && !gate.record && !thf.record && noLessonDetail && !ctx.classWideEmpty) {
            push({
                finding_code: 'ALL_ATTENDANCE_NOT_RECORDED',
                category: CATEGORY.INCOMPLETE_DATA,
                title: 'Belum ada data presensi',
                description: 'Belum terdapat data presensi siswa pada ketiga sumber.',
                evidence: ['Tidak dapat disimpulkan sebagai ALPA; data memang belum tersedia.'],
                source_module: ['GATE', 'TAHFIDZ', 'LESSON']
            });
        }

        return { findings, analysis };
    }

    /**
     * Analyze a roster. Mutates nothing; returns per-student results keyed by student_id.
     */
    analyzeClass(students, ctx) {
        const results = new Map();
        for (const st of students) {
            results.set(st.student_id, this.analyzeStudent(st, ctx));
        }
        return results;
    }
}

module.exports = new IntegratedDailyAttendanceAnalysisService();
module.exports.CATEGORY = CATEGORY;
module.exports.FINDING_CODES = FINDING_CODES;
module.exports.FINDING_CATEGORIES = FINDING_CATEGORIES;
module.exports.toHm = toHm;
