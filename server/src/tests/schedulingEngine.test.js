const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const {
  formatInTimezone,
  getHourInTimezone,
  localToUTC,
  doIntervalsOverlap,
} = require('../utils/timezone');
const { generateICS } = require('../utils/icsGenerator');
const SmartSchedulingEngine = require('../services/schedulingEngine');

describe('Timezone & UTC Normalization Utilities', () => {
  it('should accurately convert local wall-clock time to UTC Date', () => {
    // 10:00 AM EST on 2026-11-10 is 15:00 UTC
    const utcDate = localToUTC('2026-11-10', '10:00', 'America/New_York');
    assert.strictEqual(utcDate.getUTCHours(), 15);
    assert.strictEqual(utcDate.getUTCMinutes(), 0);
  });

  it('should format UTC date into different target timezones correctly', () => {
    const utcDate = new Date('2026-11-10T18:00:00Z');
    const nyStr = formatInTimezone(utcDate, 'America/New_York', 'h:mm a zzz');
    const laStr = formatInTimezone(utcDate, 'America/Los_Angeles', 'h:mm a zzz');

    assert.ok(nyStr.includes('1:00 PM EST'));
    assert.ok(laStr.includes('10:00 AM PST'));
  });

  it('should extract correct local integer hour for any timezone', () => {
    const utcDate = new Date('2026-11-10T18:00:00Z');
    const nyHour = getHourInTimezone(utcDate, 'America/New_York');
    const laHour = getHourInTimezone(utcDate, 'America/Los_Angeles');

    assert.strictEqual(nyHour, 13); // 1 PM
    assert.strictEqual(laHour, 10); // 10 AM
  });

  it('should detect overlapping intervals and allow touching boundaries', () => {
    const aStart = new Date('2026-11-10T10:00:00Z');
    const aEnd = new Date('2026-11-10T11:00:00Z');

    // Overlapping interval (10:30 - 11:30)
    const bStart = new Date('2026-11-10T10:30:00Z');
    const bEnd = new Date('2026-11-10T11:30:00Z');
    assert.strictEqual(doIntervalsOverlap(aStart, aEnd, bStart, bEnd), true);

    // Touching boundary interval (11:00 - 12:00) should NOT overlap
    const cStart = new Date('2026-11-10T11:00:00Z');
    const cEnd = new Date('2026-11-10T12:00:00Z');
    assert.strictEqual(doIntervalsOverlap(aStart, aEnd, cStart, cEnd), false);
  });
});

describe('Smart Scheduling Engine Heuristics & Scoring', () => {
  it('should reward slots that match candidate time-of-day preferences', () => {
    const slotStart = new Date('2026-11-10T19:00:00Z'); // 2 PM EST (Afternoon)
    const slotEnd = new Date('2026-11-10T20:00:00Z');

    const interviewers = [
      { timezone: 'America/New_York' },
      { timezone: 'America/Chicago' },
    ];

    const afternoonScore = SmartSchedulingEngine.calculateSlotScore({
      slotStart,
      slotEnd,
      interviewers,
      candidateHour: 14, // 2 PM local
      candidatePreferences: ['afternoon'],
    });

    const morningScore = SmartSchedulingEngine.calculateSlotScore({
      slotStart,
      slotEnd,
      interviewers,
      candidateHour: 14, // 2 PM local
      candidatePreferences: ['morning'],
    });

    assert.ok(afternoonScore.totalScore > morningScore.totalScore);
    assert.ok(afternoonScore.reasons.some((r) => r.includes('afternoon preference')));
  });

  it('should award optimal category for high scoring slots in prime hours', () => {
    const slotStart = new Date('2026-11-10T19:00:00Z'); // 11 AM PST, 2 PM EST
    const slotEnd = new Date('2026-11-10T20:00:00Z');

    const scoreDetails = SmartSchedulingEngine.calculateSlotScore({
      slotStart,
      slotEnd,
      interviewers: [
        { timezone: 'America/Los_Angeles' }, // 11 AM (Prime)
        { timezone: 'America/New_York' },    // 2 PM (Prime)
      ],
      candidateHour: 14,
      candidatePreferences: ['afternoon'],
    });

    assert.strictEqual(scoreDetails.category, 'Optimal');
    assert.ok(scoreDetails.totalScore >= 85);
  });
});

describe('RFC 5545 iCalendar (.ics) Generator', () => {
  it('should generate valid iCalendar string with DTSTART, DTEND, and Attendees', () => {
    const ics = generateICS({
      uid: 'test-interview-123@panelsync.io',
      title: 'Full-Stack Loop: Jordan Vance',
      description: 'Technical evaluation',
      startTime: new Date('2026-11-10T15:00:00Z'),
      endTime: new Date('2026-11-10T16:00:00Z'),
      location: 'https://meet.panelsync.io/room/loop-123',
      attendees: [
        { name: 'Jordan Vance', email: 'jordan@example.com' },
        { name: 'Dr. Sarah Chen', email: 'sarah@example.com' },
      ],
    });

    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('VERSION:2.0'));
    assert.ok(ics.includes('BEGIN:VEVENT'));
    assert.ok(ics.includes('UID:test-interview-123@panelsync.io'));
    assert.ok(ics.includes('SUMMARY:Full-Stack Loop: Jordan Vance'));
    assert.ok(ics.includes('ATTENDEE;CUTYPE=INDIVIDUAL'));
    assert.ok(ics.includes('mailto:jordan@example.com'));
    assert.ok(ics.includes('mailto:sarah@example.com'));
    assert.ok(ics.includes('END:VEVENT'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });
});

