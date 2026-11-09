const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const Interviewer = require('../models/Interviewer');
const CalendarEvent = require('../models/CalendarEvent');
const SmartSchedulingEngine = require('../services/schedulingEngine');
const CalendarSyncService = require('../services/calendarSyncService');
const NotificationService = require('../services/notificationService');
const ReschedulingService = require('../services/reschedulingService');
const { logAction } = require('../utils/logger');

// @desc    Run Smart Scheduling Engine to find optimal common slots
// @route   POST /api/interviews/find-slots
// @access  Private
exports.findSmartSlots = async (req, res, next) => {
  try {
    const {
      candidateId,
      interviewerIds,
      durationMinutes = 60,
      startDate,
      endDate,
      candidateTimezone,
      bufferMinutes = 15,
    } = req.body;

    if (!interviewerIds || !Array.isArray(interviewerIds) || interviewerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one interviewer ID to evaluate',
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a startDate and endDate for slot discovery',
      });
    }

    const result = await SmartSchedulingEngine.findAvailableSlots({
      candidateId,
      interviewerIds,
      durationMinutes: Number(durationMinutes),
      startDate,
      endDate,
      candidateTimezone,
      bufferMinutes: Number(bufferMinutes),
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Schedule / Book a new interview
// @route   POST /api/interviews
// @access  Private (Admin / HR)
exports.createInterview = async (req, res, next) => {
  try {
    const {
      candidateId,
      panelId,
      interviewers, // [{ interviewer: ObjectId, role: String }]
      title,
      jobRole,
      roundType = 'technical',
      scheduledStartTime,
      scheduledEndTime,
      durationMinutes = 60,
      timezone,
      meetingLink,
      meetingLocation,
    } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    // Validate interviewers array
    if (!interviewers || !Array.isArray(interviewers) || interviewers.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one interviewer is required' });
    }

    const interviewerIds = interviewers.map((i) => i.interviewer || i);

    // Double-booking check: verify none of the interviewers have an overlapping interview
    const existingOverlaps = await CalendarEvent.find({
      interviewer: { $in: interviewerIds },
      isBusy: true,
      $or: [
        {
          startTime: { $lt: new Date(scheduledEndTime) },
          endTime: { $gt: new Date(scheduledStartTime) },
        },
      ],
    }).populate('interviewer', 'name');

    if (existingOverlaps.length > 0) {
      const conflictNames = existingOverlaps.map((o) => o.interviewer?.name || 'Interviewer').join(', ');
      return res.status(409).json({
        success: false,
        message: `Scheduling conflict detected! The following interviewers are already busy: ${conflictNames}`,
        conflicts: existingOverlaps,
      });
    }

    // Format interviewers structure
    const formattedParticipants = interviewers.map((item) => ({
      interviewer: item.interviewer || item,
      role: item.role || 'Lead Interviewer',
      responseStatus: 'accepted',
    }));

    // Create Interview record
    const interview = new Interview({
      candidate: candidate._id,
      panel: panelId || null,
      interviewers: formattedParticipants,
      title: title || `${candidate.jobRole} - ${roundType.toUpperCase()} Round`,
      jobRole: jobRole || candidate.jobRole,
      roundType,
      scheduledStartTime: new Date(scheduledStartTime),
      scheduledEndTime: new Date(scheduledEndTime),
      durationMinutes: Number(durationMinutes),
      timezone: timezone || candidate.timezone || 'America/New_York',
      meetingLink: meetingLink || `https://meet.panelsync.io/room/${Math.random().toString(36).substring(2, 10)}`,
      meetingLocation: meetingLocation || 'Virtual Video Room',
      createdBy: req.user._id,
      status: 'scheduled',
    });

    await interview.save();

    // Create CalendarEvent block for each interviewer
    const calendarEventIds = [];
    for (const p of formattedParticipants) {
      const calEvent = await CalendarSyncService.createInterviewBlock({
        interviewerId: p.interviewer,
        interviewId: interview._id,
        title: `Interview: ${interview.title} (${candidate.name})`,
        startTime: interview.scheduledStartTime,
        endTime: interview.scheduledEndTime,
        location: interview.meetingLink,
      });
      calendarEventIds.push(calEvent._id);
    }

    interview.calendarEventIds = calendarEventIds;
    await interview.save();

    // Update candidate status and history
    candidate.status = 'interview_scheduled';
    if (!candidate.interviewHistory.includes(interview._id)) {
      candidate.interviewHistory.push(interview._id);
    }
    await candidate.save();

    // Dispatch Notifications & Email with .ics
    const populatedInterviewers = await Interviewer.find({ _id: { $in: interviewerIds } });
    await NotificationService.sendInterviewScheduled({
      interview,
      candidate,
      interviewers: populatedInterviewers,
      createdByUser: req.user,
    });

    // Audit Log
    await logAction({
      action: 'INTERVIEW_SCHEDULED',
      performedBy: req.user._id,
      targetEntity: 'Interview',
      targetId: interview._id.toString(),
      details: {
        candidate: candidate.name,
        role: interview.jobRole,
        start: interview.scheduledStartTime,
        interviewersCount: interviewerIds.length,
      },
    });

    const populatedInterview = await Interview.findById(interview._id)
      .populate('candidate', 'name email jobRole timezone')
      .populate('interviewers.interviewer', 'name email title department timezone');

    res.status(201).json({
      success: true,
      message: 'Interview successfully scheduled and calendar invites dispatched!',
      interview: populatedInterview,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all interviews with filtering and pagination
// @route   GET /api/interviews
// @access  Private
exports.getInterviews = async (req, res, next) => {
  try {
    const { status, candidateId, interviewerId, startDate, endDate, page = 1, limit = 25 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (candidateId) query.candidate = candidateId;
    if (interviewerId) query['interviewers.interviewer'] = interviewerId;

    if (startDate || endDate) {
      query.scheduledStartTime = {};
      if (startDate) query.scheduledStartTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.scheduledStartTime.$lte = end;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Interview.countDocuments(query);
    const interviews = await Interview.find(query)
      .sort({ scheduledStartTime: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('candidate', 'name email jobRole timezone phone status')
      .populate('panel', 'name department')
      .populate('interviewers.interviewer', 'name email title department seniority timezone')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: interviews.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      interviews,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single interview
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidate')
      .populate('panel')
      .populate('interviewers.interviewer')
      .populate('rescheduleHistory.rescheduledBy', 'name email');

    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.status(200).json({ success: true, interview });
  } catch (err) {
    next(err);
  }
};

// @desc    Update interview details
// @route   PUT /api/interviews/:id
// @access  Private (Admin / HR)
exports.updateInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('candidate')
      .populate('interviewers.interviewer');

    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.status(200).json({ success: true, interview });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel interview
// @route   POST /api/interviews/:id/cancel
// @access  Private (Admin / HR)
exports.cancelInterview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const interview = await Interview.findById(req.params.id)
      .populate('candidate')
      .populate('interviewers.interviewer');

    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

    interview.status = 'cancelled';
    interview.cancellationReason = reason || 'Cancelled by recruiter';
    await interview.save();

    // Release CalendarEvent blocks
    await CalendarEvent.deleteMany({ interview: interview._id });

    // Notify all participants
    const interviewersList = interview.interviewers.map((p) => p.interviewer);
    await NotificationService.sendInterviewCancelled({
      interview,
      candidate: interview.candidate,
      interviewers: interviewersList,
      reason: interview.cancellationReason,
    });

    // Audit Log
    await logAction({
      action: 'INTERVIEW_CANCELLED',
      performedBy: req.user._id,
      targetEntity: 'Interview',
      targetId: interview._id.toString(),
      details: { reason: interview.cancellationReason },
    });

    res.status(200).json({
      success: true,
      message: 'Interview successfully cancelled and participants notified',
      interview,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Detect conflicts for an interview
// @route   GET /api/interviews/:id/conflicts
// @access  Private
exports.checkConflicts = async (req, res, next) => {
  try {
    const result = await ReschedulingService.checkInterviewConflicts(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// @desc    Get automatic alternative slots for rescheduling
// @route   GET /api/interviews/:id/reschedule-options
// @access  Private
exports.getRescheduleOptions = async (req, res, next) => {
  try {
    const daysForward = Number(req.query.daysForward) || 7;
    const result = await ReschedulingService.getAlternativeSlots(req.params.id, daysForward);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// @desc    Commit interview rescheduling
// @route   POST /api/interviews/:id/reschedule
// @access  Private (Admin / HR)
exports.rescheduleInterview = async (req, res, next) => {
  try {
    const { newStartTime, newEndTime, reason } = req.body;

    if (!newStartTime || !newEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Both newStartTime and newEndTime are required',
      });
    }

    const interview = await ReschedulingService.rescheduleInterview({
      interviewId: req.params.id,
      newStartTime,
      newEndTime,
      reason,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: 'Interview successfully rescheduled and participants notified!',
      interview,
    });
  } catch (err) {
    next(err);
  }
};

