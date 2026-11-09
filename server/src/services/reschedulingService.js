const Interview = require('../models/Interview');
const Interviewer = require('../models/Interviewer');
const Candidate = require('../models/Candidate');
const CalendarEvent = require('../models/CalendarEvent');
const SmartSchedulingEngine = require('./schedulingEngine');
const NotificationService = require('./notificationService');
const CalendarSyncService = require('./calendarSyncService');
const { logAction } = require('../utils/logger');
const { addDays, format } = require('date-fns');

class ReschedulingService {
  /**
   * Detect potential conflicts for an interview or check if any assigned interviewer is blocked
   */
  static async checkInterviewConflicts(interviewId) {
    const interview = await Interview.findById(interviewId)
      .populate('candidate')
      .populate('interviewers.interviewer');

    if (!interview) throw new Error('Interview not found');

    const conflicts = [];
    const interviewerIds = interview.interviewers.map((p) => p.interviewer._id);

    // Look for overlapping calendar events (excluding this interview's own calendar events)
    const overlappingEvents = await CalendarEvent.find({
      interviewer: { $in: interviewerIds },
      interview: { $ne: interview._id },
      isBusy: true,
      $or: [
        {
          startTime: { $lt: interview.scheduledEndTime },
          endTime: { $gt: interview.scheduledStartTime },
        },
      ],
    }).populate('interviewer');

    for (const ev of overlappingEvents) {
      conflicts.push({
        type: 'CALENDAR_OVERLAP',
        interviewerId: ev.interviewer._id,
        interviewerName: ev.interviewer.name,
        conflictingEventTitle: ev.title,
        startTime: ev.startTime,
        endTime: ev.endTime,
      });
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      interview,
    };
  }

  /**
   * Automatically search alternative time slots for an interview
   */
  static async getAlternativeSlots(interviewId, daysForward = 7) {
    const interview = await Interview.findById(interviewId)
      .populate('candidate')
      .populate('interviewers.interviewer');

    if (!interview) throw new Error('Interview not found');

    const interviewerIds = interview.interviewers.map((p) => p.interviewer._id);
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), daysForward), 'yyyy-MM-dd');

    const searchResults = await SmartSchedulingEngine.findAvailableSlots({
      candidate: interview.candidate,
      interviewerIds,
      durationMinutes: interview.durationMinutes,
      startDate,
      endDate,
      candidateTimezone: interview.candidate?.timezone || interview.timezone,
    });

    return {
      interviewId,
      currentStartTime: interview.scheduledStartTime,
      currentEndTime: interview.scheduledEndTime,
      candidate: interview.candidate,
      interviewers: interview.interviewers.map((p) => p.interviewer),
      alternativeSlots: searchResults.recommendedSlots.concat(searchResults.commonSlots.slice(0, 5)),
      nearMissSlots: searchResults.alternativeSlots,
      conflictWarnings: searchResults.conflictWarnings,
    };
  }

  /**
   * Reschedule the interview to a new time slot
   */
  static async rescheduleInterview({ interviewId, newStartTime, newEndTime, reason, userId }) {
    const interview = await Interview.findById(interviewId)
      .populate('candidate')
      .populate('interviewers.interviewer');

    if (!interview) throw new Error('Interview not found');
    if (interview.status === 'cancelled') {
      throw new Error('Cannot reschedule a cancelled interview');
    }

    const oldStartTime = interview.scheduledStartTime;
    const oldEndTime = interview.scheduledEndTime;

    // Record in rescheduleHistory
    interview.rescheduleHistory.push({
      previousStartTime: oldStartTime,
      previousEndTime: oldEndTime,
      newStartTime: new Date(newStartTime),
      newEndTime: new Date(newEndTime),
      rescheduledBy: userId,
      reason: reason || 'Requested by recruiter / interviewer conflict',
      createdAt: new Date(),
    });

    interview.scheduledStartTime = new Date(newStartTime);
    interview.scheduledEndTime = new Date(newEndTime);
    interview.status = 'rescheduled';
    await interview.save();

    // Update existing calendar events
    await CalendarEvent.updateMany(
      { interview: interview._id },
      {
        startTime: interview.scheduledStartTime,
        endTime: interview.scheduledEndTime,
        title: `Interview: ${interview.title} (${interview.jobRole}) [Rescheduled]`,
      }
    );

    // Notify all participants
    const interviewersList = interview.interviewers.map((p) => p.interviewer);
    await NotificationService.sendInterviewRescheduled({
      interview,
      candidate: interview.candidate,
      interviewers: interviewersList,
      reason: reason || 'Schedule coordination adjustment',
      oldStartTime,
      oldEndTime,
    });

    // Audit Log
    await logAction({
      action: 'INTERVIEW_RESCHEDULED',
      performedBy: userId,
      targetEntity: 'Interview',
      targetId: interview._id.toString(),
      details: {
        oldStartTime,
        oldEndTime,
        newStartTime,
        newEndTime,
        reason,
      },
    });

    return interview;
  }
}

module.exports = ReschedulingService;

