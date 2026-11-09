const { format, toZonedTime, fromZonedTime } = require('date-fns-tz');
const { parseISO, addMinutes, isBefore, isAfter, areIntervalsOverlapping } = require('date-fns');

/**
 * Standard supported time zones for global scheduling
 */
const SUPPORTED_TIMEZONES = [
  'UTC',
  'America/New_York',       // US Eastern
  'America/Chicago',        // US Central
  'America/Denver',         // US Mountain
  'America/Los_Angeles',    // US Pacific
  'Europe/London',          // GMT / BST
  'Europe/Berlin',          // Central European
  'Asia/Dubai',             // Gulf Standard
  'Asia/Kolkata',           // India Standard
  'Asia/Singapore',         // Singapore
  'Asia/Tokyo',             // Japan Standard
  'Australia/Sydney',       // AEST
];

/**
 * Format a UTC Date into target time zone with readable string
 */
const formatInTimezone = (utcDate, timezone = 'UTC', formatStr = 'yyyy-MM-dd HH:mm:ss zzz') => {
  const zoned = toZonedTime(utcDate, timezone);
  return format(zoned, formatStr, { timeZone: timezone });
};

/**
 * Get integer hour (0-23) of a UTC Date in target time zone
 */
const getHourInTimezone = (utcDate, timezone = 'UTC') => {
  const zoned = toZonedTime(utcDate, timezone);
  return parseInt(format(zoned, 'H', { timeZone: timezone }), 10);
};

/**
 * Convert a local wall-clock string "YYYY-MM-DD" + "HH:mm" in given timezone into a standard UTC Date
 */
const localToUTC = (dateStr, timeStr, timezone = 'UTC') => {
  return fromZonedTime(`${dateStr} ${timeStr}:00`, timezone);
};

/**
 * Check if two intervals overlap (considering start & end dates)
 */
const doIntervalsOverlap = (startA, endA, startB, endB) => {
  return areIntervalsOverlapping(
    { start: new Date(startA), end: new Date(endA) },
    { start: new Date(startB), end: new Date(endB) },
    { inclusive: false } // Touching boundaries (e.g. 10:00-11:00 and 11:00-12:00) don't overlap
  );
};

module.exports = {
  SUPPORTED_TIMEZONES,
  formatInTimezone,
  getHourInTimezone,
  localToUTC,
  doIntervalsOverlap,
};
