const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const Interviewer = require('../models/Interviewer');
const InterviewPanel = require('../models/InterviewPanel');
const SmartSchedulingEngine = require('../services/schedulingEngine');
const CalendarSyncService = require('../services/calendarSyncService');
const NotificationService = require('../services/notificationService');
const { logAction } = require('../utils/logger');
const { addDays, format } = require('date-fns');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Private
exports.getCandidates = async (req, res, next) => {
  try {
    const { status, role, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (role && role !== 'all') query.jobRole = { $regex: role, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { jobRole: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Candidate.countDocuments(query);
    const candidates = await Candidate.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: 'interviewHistory',
        select: 'title roundType scheduledStartTime scheduledEndTime status interviewers',
        populate: { path: 'interviewers.interviewer', select: 'name title email' },
      });

    res.status(200).json({
      success: true,
      count: candidates.length,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      candidates,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get candidate by ID
// @route   GET /api/candidates/:id
// @access  Private
exports.getCandidateById = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate({
      path: 'interviewHistory',
      populate: { path: 'interviewers.interviewer', select: 'name title email department' },
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    res.status(200).json({ success: true, candidate });
  } catch (err) {
    next(err);
  }
};

// @desc    Create candidate
// @route   POST /api/candidates
// @access  Private (Admin / HR)
exports.createCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.create(req.body);

    await logAction({
      action: 'CANDIDATE_CREATED',
      performedBy: req.user._id,
      targetEntity: 'Candidate',
      targetId: candidate._id.toString(),
      details: { name: candidate.name, email: candidate.email, jobRole: candidate.jobRole },
    });

    res.status(201).json({ success: true, candidate });
  } catch (err) {
    next(err);
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private (Admin / HR)
exports.updateCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    await logAction({
      action: 'CANDIDATE_UPDATED',
      performedBy: req.user._id,
      targetEntity: 'Candidate',
      targetId: candidate._id.toString(),
      details: req.body,
    });

    res.status(200).json({ success: true, candidate });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private (Admin / HR)
exports.deleteCandidate = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Cancel any upcoming scheduled interviews for this candidate
    await Interview.updateMany(
      { candidate: candidate._id, status: 'scheduled' },
      { status: 'cancelled', cancellationReason: 'Candidate profile deleted' }
    );

    await candidate.deleteOne();

    await logAction({
      action: 'CANDIDATE_DELETED',
      performedBy: req.user._id,
      targetEntity: 'Candidate',
      targetId: req.params.id,
      details: { name: candidate.name },
    });

    res.status(200).json({ success: true, message: 'Candidate deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get public candidate details & available slots for self-scheduling
// @route   GET /api/candidates/:id/public-slots
// @access  Public
exports.getPublicCandidateProfileAndSlots = async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate invitation not found' });

    // Find panel for candidate's role, or use active interviewers
    let panel = await InterviewPanel.findOne({ targetRole: candidate.jobRole, isActive: true })
      .populate('interviewers.interviewer');

    if (!panel) {
      panel = await InterviewPanel.findOne({ isActive: true }).populate('interviewers.interviewer');
    }

    let interviewerIds = [];
    if (panel && panel.interviewers?.length > 0) {
      interviewerIds = panel.interviewers.map((i) => i.interviewer._id);
    } else {
      const allInv = await Interviewer.find({ isActive: true }).limit(2);
      interviewerIds = allInv.map((i) => i._id);
    }

    const startDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');

    const engineResults = await SmartSchedulingEngine.findAvailableSlots({
      candidate,
      interviewerIds,
      durationMinutes: panel?.defaultDurationMinutes || 60,
      startDate,
      endDate,
      candidateTimezone: candidate.timezone,
      bufferMinutes: 15,
    });

    res.status(200).json({
      success: true,
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        jobRole: candidate.jobRole,
        timezone: candidate.timezone,
      },
      panel: panel ? { name: panel.name, duration: panel.defaultDurationMinutes } : null,
      interviewersCount: interviewerIds.length,
      availableSlots: engineResults.recommendedSlots.concat(engineResults.commonSlots.slice(0, 6)),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Confirm and book slot by candidate directly
// @route   POST /api/candidates/:id/self-book
// @access  Public
exports.selfBookCandidate = async (req, res, next) => {
  try {
    const { slot } = req.body;
    if (!slot || !slot.startTime || !slot.endTime) {
      return res.status(400).json({ success: false, message: 'Valid slot is required' });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    let panel = await InterviewPanel.findOne({ targetRole: candidate.jobRole, isActive: true })
      .populate('interviewers.interviewer');

    if (!panel) {
      panel = await InterviewPanel.findOne({ isActive: true }).populate('interviewers.interviewer');
    }

    let interviewersList = [];
    if (panel && panel.interviewers?.length > 0) {
      interviewersList = panel.interviewers.map((i) => ({
        interviewer: i.interviewer._id,
        role: i.role,
        responseStatus: 'accepted',
      }));
    } else {
      const allInv = await Interviewer.find({ isActive: true }).limit(2);
      interviewersList = allInv.map((i) => ({
        interviewer: i._id,
        role: 'Evaluator',
        responseStatus: 'accepted',
      }));
    }

    const interview = new Interview({
      candidate: candidate._id,
      panel: panel ? panel._id : null,
      interviewers: interviewersList,
      title: `${panel ? panel.name : `${candidate.jobRole} Loop`}`,
      jobRole: candidate.jobRole,
      roundType: 'technical',
      scheduledStartTime: new Date(slot.startTime),
      scheduledEndTime: new Date(slot.endTime),
      durationMinutes: slot.durationMinutes || 60,
      timezone: candidate.timezone,
      status: 'scheduled',
    });

    await interview.save();

    // Create calendar blocks
    for (const p of interviewersList) {
      await CalendarSyncService.createInterviewBlock({
        interviewerId: p.interviewer,
        interviewId: interview._id,
        title: `Interview: ${interview.title} (${candidate.name})`,
        startTime: interview.scheduledStartTime,
        endTime: interview.scheduledEndTime,
        location: interview.meetingLink,
      });
    }

    candidate.status = 'interview_scheduled';
    if (!candidate.interviewHistory.includes(interview._id)) {
      candidate.interviewHistory.push(interview._id);
    }
    await candidate.save();

    // Dispatch notifications
    const populatedInterviewers = await Interviewer.find({
      _id: { $in: interviewersList.map((i) => i.interviewer) },
    });

    await NotificationService.sendInterviewScheduled({
      interview,
      candidate,
      interviewers: populatedInterviewers,
      createdByUser: { name: 'Candidate Self-Schedule', email: candidate.email },
    });

    await logAction({
      action: 'CANDIDATE_SELF_SCHEDULED',
      targetEntity: 'Interview',
      targetId: interview._id.toString(),
      details: { candidate: candidate.name, time: interview.scheduledStartTime },
    });

    res.status(201).json({
      success: true,
      message: 'Interview successfully confirmed! Check your email for calendar invite.',
      interview,
    });
  } catch (err) {
    next(err);
  }
};

