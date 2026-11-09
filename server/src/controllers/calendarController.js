const CalendarEvent = require('../models/CalendarEvent');
const Interview = require('../models/Interview');
const Interviewer = require('../models/Interviewer');
const CalendarSyncService = require('../services/calendarSyncService');

// @desc    Get aggregated calendar events for calendar view (Day, Week, Month)
// @route   GET /api/calendar/feed
// @access  Private
exports.getCalendarFeed = async (req, res, next) => {
  try {
    const { start, end, interviewerId, candidateId, viewMode = 'all' } = req.query;

    const startDate = start ? new Date(start) : new Date();
    const endDate = end ? new Date(end) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const interviewQuery = {
      scheduledStartTime: { $lt: endDate },
      scheduledEndTime: { $gt: startDate },
    };

    if (candidateId) interviewQuery.candidate = candidateId;
    if (interviewerId) interviewQuery['interviewers.interviewer'] = interviewerId;

    const interviews = await Interview.find(interviewQuery)
      .populate('candidate', 'name jobRole email timezone')
      .populate('interviewers.interviewer', 'name email title department timezone');

    // Fetch busy blocks/calendar events if requested
    let calendarEvents = [];
    if (viewMode === 'all' || viewMode === 'busy') {
      const eventQuery = {
        startTime: { $lt: endDate },
        endTime: { $gt: startDate },
      };
      if (interviewerId) eventQuery.interviewer = interviewerId;

      calendarEvents = await CalendarEvent.find(eventQuery)
        .populate('interviewer', 'name email department timezone')
        .limit(150);
    }

    res.status(200).json({
      success: true,
      timeframe: { start: startDate, end: endDate },
      interviews,
      calendarEvents,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create manual calendar block
// @route   POST /api/calendar/events
// @access  Private
exports.createEvent = async (req, res, next) => {
  try {
    const { interviewerId, title, startTime, endTime, description, location } = req.body;
    const event = await CalendarEvent.create({
      interviewer: interviewerId,
      source: 'manual',
      title: title || 'Busy Slot',
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      isBusy: true,
      description,
      location,
    });

    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete calendar event
// @route   DELETE /api/calendar/events/:id
// @access  Private
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await event.deleteOne();
    res.status(200).json({ success: true, message: 'Event removed from calendar' });
  } catch (err) {
    next(err);
  }
};

// @desc    Sync all mock calendars for quick dev environment setup
// @route   POST /api/calendar/sync-all
// @access  Private
exports.syncAllMockCalendars = async (req, res, next) => {
  try {
    const interviewers = await Interviewer.find({ isActive: true });
    let totalEvents = 0;

    for (const inv of interviewers) {
      const result = await CalendarSyncService.syncMockCalendar(inv, req.user._id);
      totalEvents += result.eventsCount || 0;
    }

    res.status(200).json({
      success: true,
      message: `Synchronized ${totalEvents} calendar blocks across ${interviewers.length} interviewers`,
    });
  } catch (err) {
    next(err);
  }
};

