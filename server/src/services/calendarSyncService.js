const CalendarEvent = require('../models/CalendarEvent');
const Interviewer = require('../models/Interviewer');
const { logAction } = require('../utils/logger');
const { addDays, setHours, setMinutes } = require('date-fns');

/**
 * Calendar Sync Service (Google Calendar & Microsoft Outlook Calendar + Mock Simulator)
 */
class CalendarSyncService {
  /**
   * Sync calendar for a given interviewer
   */
  static async syncCalendar(interviewerId, userId = null) {
    const interviewer = await Interviewer.findById(interviewerId);
    if (!interviewer) throw new Error('Interviewer not found');

    const provider = interviewer.calendarSync?.provider || 'google';
    const isMock = interviewer.calendarSync?.mockMode ?? true;

    if (isMock) {
      return this.syncMockCalendar(interviewer, userId);
    }

    // In production with actual OAuth credentials:
    if (provider === 'google') {
      return this.syncGoogleCalendar(interviewer, userId);
    } else if (provider === 'outlook') {
      return this.syncOutlookCalendar(interviewer, userId);
    }

    return { success: true, message: 'Calendar sync skipped (provider none)' };
  }

  /**
   * Mock Calendar Sync Simulator: Generates realistic recurring meetings, 1-on-1s, and syncs them
   */
  static async syncMockCalendar(interviewer, userId = null) {
    interviewer.calendarSync.syncStatus = 'syncing';
    await interviewer.save();

    // Remove existing non-interview mock events for the interviewer to re-simulate
    await CalendarEvent.deleteMany({
      interviewer: interviewer._id,
      source: 'mock',
    });

    const now = new Date();
    const mockEventsToCreate = [];

    // Simulate events for the next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const targetDate = addDays(now, dayOffset);
      const dayOfWeek = targetDate.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // 1. Daily Team Standup (09:30 - 10:00 local)
      const standupStart = setMinutes(setHours(targetDate, 9), 30);
      const standupEnd = setMinutes(setHours(targetDate, 10), 0);
      mockEventsToCreate.push({
        interviewer: interviewer._id,
        externalEventId: `mock-standup-${dayOffset}-${interviewer._id}`,
        source: 'mock',
        title: 'Daily Team Standup & Sync',
        startTime: standupStart,
        endTime: standupEnd,
        isBusy: true,
        description: 'Engineering sync via Google Meet',
        location: 'Google Meet',
      });

      // 2. Midday Architecture or 1-on-1 (On certain days)
      if (dayOffset % 2 === 0) {
        const meetingStart = setMinutes(setHours(targetDate, 14), 0);
        const meetingEnd = setMinutes(setHours(targetDate, 15), 0);
        mockEventsToCreate.push({
          interviewer: interviewer._id,
          externalEventId: `mock-design-${dayOffset}-${interviewer._id}`,
          source: 'mock',
          title: 'System Design Review & RFC Discussion',
          startTime: meetingStart,
          endTime: meetingEnd,
          isBusy: true,
          description: 'Weekly tech architecture alignment',
          location: 'Conference Room 4B / Zoom',
        });
      }

      // 3. Sprint Planning or Retrospective (Fridays or Mondays)
      if (dayOfWeek === 1 || dayOfWeek === 5) {
        const planStart = setMinutes(setHours(targetDate, 16), 0);
        const planEnd = setMinutes(setHours(targetDate, 17), 0);
        mockEventsToCreate.push({
          interviewer: interviewer._id,
          externalEventId: `mock-sprint-${dayOffset}-${interviewer._id}`,
          source: 'mock',
          title: dayOfWeek === 1 ? 'Sprint Planning & Backlog Refinement' : 'Team Retrospective',
          startTime: planStart,
          endTime: planEnd,
          isBusy: true,
          description: 'Team ceremony',
          location: 'Zoom',
        });
      }
    }

    await CalendarEvent.insertMany(mockEventsToCreate);

    interviewer.calendarSync.syncStatus = 'connected';
    interviewer.calendarSync.lastSyncedAt = new Date();
    await interviewer.save();

    await logAction({
      action: 'MOCK_CALENDAR_SYNC',
      performedBy: userId,
      targetEntity: 'Interviewer',
      targetId: interviewer._id.toString(),
      details: {
        eventsSynced: mockEventsToCreate.length,
        provider: interviewer.calendarSync.provider,
      },
    });

    return {
      success: true,
      message: `Successfully synchronized ${mockEventsToCreate.length} calendar events for ${interviewer.name}`,
      eventsCount: mockEventsToCreate.length,
      lastSyncedAt: interviewer.calendarSync.lastSyncedAt,
    };
  }

  /**
   * Production Google Calendar Sync stub
   */
  static async syncGoogleCalendar(interviewer, userId = null) {
    // When live credentials provided, Google Calendar v3 API events.list is executed here.
    return this.syncMockCalendar(interviewer, userId);
  }

  /**
   * Production Outlook / Microsoft Graph API sync stub
   */
  static async syncOutlookCalendar(interviewer, userId = null) {
    // When live credentials provided, Microsoft Graph API /me/events is executed here.
    return this.syncMockCalendar(interviewer, userId);
  }

  /**
   * Create an internal CalendarEvent and block the interviewer's calendar
   */
  static async createInterviewBlock({ interviewerId, interviewId, title, startTime, endTime, location }) {
    const event = new CalendarEvent({
      interviewer: interviewerId,
      interview: interviewId,
      externalEventId: `int-block-${interviewId}-${interviewerId}`,
      source: 'internal',
      title: title || 'Scheduled Interview',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isBusy: true,
      description: `Interview booked via PanelSync. Interview ID: ${interviewId}`,
      location,
    });
    await event.save();
    return event;
  }
}

module.exports = CalendarSyncService;

