'use strict';

const pad = (num) => String(num).padStart(2, '0');

const parseScannedAt = (value) => {
    if (!value) return new Date();
    const normalized = String(value).replace(' ', 'T');
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const toDateOnly = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toDateTimeString = (date) => {
    return `${toDateOnly(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const combineDateAndTime = (date, timeString) => {
    if (!timeString) return null;
    const [hour = '0', minute = '0', second = '0'] = String(timeString).split(':');
    const combined = new Date(date);
    combined.setHours(parseInt(hour, 10), parseInt(minute, 10), parseInt(second, 10), 0);
    return combined;
};

const calcDiffMinutes = (start, end) => Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));

module.exports = {
    parseScannedAt,
    toDateOnly,
    toDateTimeString,
    combineDateAndTime,
    calcDiffMinutes
};

