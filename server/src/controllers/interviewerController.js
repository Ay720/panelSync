const Interviewer = require('../models/Interviewer');
const Availability = require('../models/Availability');
const Interview = require('../models/Interview');
const CalendarSyncService = require('../services/calendarSyncService');
const { logAction } = require('../utils/logger');
const { startOfWeek, endOfWeek } = require('date-fns');

// @desc    Get all interviewers
// @route   GET /api/interviewers
// @access  Private
exports.getInterviewers = async (req, res, next) => {
  try {
    const { department, seniority, skill, search } = req.query;
    const query = { isActive: true };

    if (department && department !== 'all') query.department = department;
    if (seniority && seniority !== 'all') query.seniority = seniority;
    if (skill) query.skills = { $in: [new RegExp(skill, 'i')] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const interviewers = await Interviewer.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: interviewers.length, interviewers });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single interviewer by ID
// @route   GET /api/interviewers/:id
// @access  Private
exports.getInterviewerById = async (req, res, next) => {
  try {
    const interviewer = await Interviewer.findById(req.params.id);
    if (!interviewer) return res.status(404).json({ success: false, message: 'Interviewer not found' });

    // Fetch availability
    const availability = await Availability.findOne({ interviewer: interviewer._id });

    // Fetch assigned interviews
    const interviews = await Interview.find({
      'interviewers.interviewer': interviewer._id,
    })
      .sort({ scheduledStartTime: -1 })
      .limit(10)
      .populate('candidate', 'name jobRole email');

    res.status(200).json({
      success: true,
      interviewer,
      availability,
      recentInterviews: interviews,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create interviewer
// @route   POST /api/interviewers
// @access  Private (Admin / HR)
exports.createInterviewer = async (req, res, next) => {
  try {
    const interviewer = await Interviewer.create(req.body);

    // Create default availability schedule
    await Availability.create({
      interviewer: interviewer._id,
      timezone: interviewer.timezone || 'America/Los_Angeles',
    });

    // Automatically trigger mock calendar sync to create realistic busy slots
    await CalendarSyncService.syncMockCalendar(interviewer, req.user._id);

    await logAction({
      action: 'INTERVIEWER_CREATED',
      performedBy: req.user._id,
      targetEntity: 'Interviewer',
      targetId: interviewer._id.toString(),
      details: { name: interviewer.name, department: interviewer.department },
    });

    res.status(201).json({ success: true, interviewer });
  } catch (err) {
    next(err);
  }
};

// @desc    Update interviewer
// @route   PUT /api/interviewers/:id
// @access  Private (Admin / HR)
exports.updateInterviewer = async (req, res, next) => {
  try {
    const interviewer = await Interviewer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!interviewer) {
      return res.status(404).json({ success: false, message: 'Interviewer not found' });
    }

    res.status(200).json({ success: true, interviewer });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete / deactivate interviewer
// @route   DELETE /api/interviewers/:id
// @access  Private (Admin / HR)
exports.deleteInterviewer = async (req, res, next) => {
  try {
    const interviewer = await Interviewer.findById(req.params.id);
    if (!interviewer) {
      return res.status(404).json({ success: false, message: 'Interviewer not found' });
    }

    interviewer.isActive = false;
    await interviewer.save();

    res.status(200).json({ success: true, message: 'Interviewer deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Trigger calendar sync for interviewer
// @route   POST /api/interviewers/:id/sync-calendar
// @access  Private
exports.syncCalendar = async (req, res, next) => {
  try {
    const result = await CalendarSyncService.syncCalendar(req.params.id, req.user._id);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

