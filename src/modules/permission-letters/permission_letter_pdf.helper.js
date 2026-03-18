'use strict';

const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN_INDO = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format date string to Indonesian format
 * e.g. "2026-03-17" → "17 Maret 2026"
 */
function formatTanggalIndo(dateStr) {
    if (!dateStr) return '-';
    // Append T00:00:00 to avoid timezone shift on DATEONLY strings
    const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.getDate()} ${BULAN_INDO[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Get Indonesian day name from date string
 * e.g. "2026-03-17" → "Selasa"
 */
function formatHariIndo(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(String(dateStr).slice(0, 10) + 'T00:00:00');
    if (isNaN(d.getTime())) return '-';
    return HARI_INDO[d.getDay()];
}

/**
 * Format time string to Indonesian format
 * e.g. "08:00:00" → "08.00 WIB"
 */
function formatWaktu(timeStr) {
    if (!timeStr) return '-';
    const parts = String(timeStr).split(':');
    if (parts.length < 2) return timeStr;
    return `${parts[0]}.${parts[1]} WIB`;
}

/**
 * Check if two DATEONLY strings represent the same date
 */
function isSameDate(date1, date2) {
    if (!date1 || !date2) return false;
    return String(date1).slice(0, 10) === String(date2).slice(0, 10);
}

module.exports = { formatTanggalIndo, formatHariIndo, formatWaktu, isSameDate };
