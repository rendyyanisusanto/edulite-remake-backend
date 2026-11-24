'use strict';

const PRESENT_STATUSES = new Set(['HADIR', 'TERLAMBAT']);
const RECORDED_STATUSES = new Set(['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA']);
const INCOMPLETE_STATUSES = new Set(['NOT_RECORDED', 'MISSING_DETAIL', 'CANCELLED']);

function groupConsecutiveEpisodes(orderedCells, predicate) {
    const episodes = [];
    let current = [];

    for (const cell of orderedCells) {
        if (predicate(cell)) {
            current.push(Number(cell.period_number));
        } else if (current.length > 0) {
            episodes.push(current);
            current = [];
        }
    }
    if (current.length > 0) {
        episodes.push(current);
    }
    return episodes;
}

function formatEpisodes(episodes) {
    return episodes
        .map((ep) => (ep.length === 1 ? `J${ep[0]}` : `J${ep[0]}–J${ep[ep.length - 1]}`))
        .join(', ');
}

/**
 * Analyzes an ordered sequence of period cells for a single student on a single day.
 * Never invents a BOLOS status; computes derived potential truancy flags dynamically.
 *
 * @param {Array<{period_number: number, status: string}>} orderedCells
 */
function analyzeStudentDailySequence(orderedCells = []) {
    const summary = {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        alpa: 0,
        recorded_periods: 0,
        not_recorded_periods: 0
    };

    let firstPresentIdx = -1;
    let lastPresentIdx = -1;
    let lastRecordedPresentPeriod = null;

    const absentPeriods = [];
    const potentialTruancyPeriods = [];
    const absentAtStartPeriods = [];
    let hasIncomplete = false;

    for (let i = 0; i < orderedCells.length; i += 1) {
        const cell = orderedCells[i];
        const st = cell.status;
        const pn = Number(cell.period_number);

        if (st === 'HADIR') summary.hadir += 1;
        else if (st === 'TERLAMBAT') summary.terlambat += 1;
        else if (st === 'IZIN') summary.izin += 1;
        else if (st === 'SAKIT') summary.sakit += 1;
        else if (st === 'ALPA') {
            summary.alpa += 1;
            absentPeriods.push(pn);
        }

        if (RECORDED_STATUSES.has(st)) {
            summary.recorded_periods += 1;
        }
        if (INCOMPLETE_STATUSES.has(st)) {
            summary.not_recorded_periods += 1;
            hasIncomplete = true;
        }

        if (PRESENT_STATUSES.has(st)) {
            if (firstPresentIdx === -1) firstPresentIdx = i;
            lastPresentIdx = i;
            lastRecordedPresentPeriod = pn;
        }
    }

    let firstTruancyIdx = -1;
    for (let i = 0; i < orderedCells.length; i += 1) {
        const cell = orderedCells[i];
        if (cell.status === 'ALPA') {
            const pn = Number(cell.period_number);
            if (firstPresentIdx !== -1 && i > firstPresentIdx) {
                potentialTruancyPeriods.push(pn);
                if (firstTruancyIdx === -1) firstTruancyIdx = i;
            } else {
                absentAtStartPeriods.push(pn);
            }
        }
    }

    const potentialTruancy = potentialTruancyPeriods.length > 0;
    const returnedAfterAbsence = potentialTruancy && lastPresentIdx > firstTruancyIdx;
    const absentAfterLastPresence =
        potentialTruancy &&
        lastRecordedPresentPeriod !== null &&
        potentialTruancyPeriods[potentialTruancyPeriods.length - 1] > lastRecordedPresentPeriod;
    const absentAtStart = absentAtStartPeriods.length > 0;
    const allRecordedPeriodsAbsent =
        summary.recorded_periods > 0 && summary.alpa === summary.recorded_periods;

    // Group consecutive episodes strictly by adjacency in orderedCells
    const truancySet = new Set(potentialTruancyPeriods);
    const truancyEpisodes = groupConsecutiveEpisodes(
        orderedCells,
        (c) => c.status === 'ALPA' && truancySet.has(Number(c.period_number))
    );

    const startSet = new Set(absentAtStartPeriods);
    const startEpisodes = groupConsecutiveEpisodes(
        orderedCells,
        (c) => c.status === 'ALPA' && startSet.has(Number(c.period_number))
    );

    let indicationSummary = '-';
    if (potentialTruancy) {
        const epLabel = formatEpisodes(truancyEpisodes);
        if (returnedAfterAbsence && !absentAfterLastPresence) {
            indicationSummary = `Indikasi bolos ${epLabel} (kembali hadir)`;
        } else if (absentAfterLastPresence && returnedAfterAbsence) {
            indicationSummary = `Indikasi bolos ${epLabel} (sebagian kembali hadir)`;
        } else {
            indicationSummary = `Indikasi bolos ${epLabel}`;
        }
    } else if (summary.recorded_periods === 0) {
        indicationSummary = 'Belum ada presensi';
    } else if (allRecordedPeriodsAbsent) {
        indicationSummary = 'Alpa seluruh jam tercatat';
    } else if (absentAtStart) {
        indicationSummary = `Alpa jam awal ${formatEpisodes(startEpisodes)}`;
    } else if (hasIncomplete) {
        indicationSummary = 'Presensi belum lengkap';
    }

    return {
        summary,
        potential_truancy: potentialTruancy,
        potential_truancy_periods: potentialTruancyPeriods,
        potential_truancy_episodes_text: potentialTruancy ? formatEpisodes(truancyEpisodes) : '',
        absent_periods: absentPeriods,
        absent_at_start: absentAtStart,
        absent_at_start_periods: absentAtStartPeriods,
        returned_after_absence: returnedAfterAbsence,
        absent_after_last_presence: absentAfterLastPresence,
        all_recorded_periods_absent: allRecordedPeriodsAbsent,
        last_recorded_present_period: lastRecordedPresentPeriod,
        incomplete_attendance: hasIncomplete,
        recorded_period_count: summary.recorded_periods,
        indication_summary: indicationSummary,
        flags: {
            POTENTIAL_TRUANCY: potentialTruancy,
            RETURNED_AFTER_ABSENCE: returnedAfterAbsence,
            ABSENT_AFTER_LAST_PRESENCE: absentAfterLastPresence,
            ABSENT_AT_START: absentAtStart,
            ALL_RECORDED_PERIODS_ABSENT: allRecordedPeriodsAbsent,
            INCOMPLETE_ATTENDANCE: hasIncomplete
        }
    };
}

module.exports = {
    analyzeStudentDailySequence,
    groupConsecutiveEpisodes,
    formatEpisodes,
    PRESENT_STATUSES,
    RECORDED_STATUSES
};
