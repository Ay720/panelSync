const Availability = require('../models/Availability');
const Interviewer = require('../models/Interviewer');
const { logAction } = require('../utils/logger');

// @desc    Get availability by interviewer ID
// @route   GET /api/availability/interviewer/:interviewerId
// @access  Private
exports.getAvailabilityByInterviewer = async (req, res, next) => {
  try {
    let availability = await Availability.findOne({ interviewer: req.params.interviewerId });

    if (!availability) {
      // Auto-initialize if doesn't exist yet
      const interviewer = await Interviewer.findById(req.params.interviewerId);
      if (!interviewer) return res.status(404).json({ success: false, message: 'Interviewer not found' });

      availability = await Availability.create({
        interviewer: interviewer._id,
        timezone: interviewer.timezone || 'America/Los_Angeles',
      });
    }

    res.status(200).json({ success: true, availability });
  } catch (err) {
    next(err);
  }
};

// @desc    Update weekly availability schedule
// @route   PUT /api/availability/interviewer/:interviewerId
// @access  Private
exports.updateWeeklySchedule = async (req, res, next) => {
  try {
    const { weeklySchedule, timezone } = req.body;

    let availability = await Availability.findOne({ interviewer: req.params.interviewerId });
    if (!availability) {
      availability = new Availability({ interviewer: req.params.interviewerId });
    }

    if (weeklySchedule) availability.weeklySchedule = weeklySchedule;
    if (timezone) availability.timezone = timezone;

    await availability.save();

    await logAction({
      action: 'AVAILABILITY_UPDATED',
      performedBy: req.user._id,
      targetEntity: 'Availability',
      targetId: availability._id.toString(),
      details: { interviewerId: req.params.interviewerId },
    });

    res.status(200).json({ success: true, availability });
  } catch (err) {
    next(err);
  }
};

// @desc    Add date override (PTO / vacation / custom hours)
// @route   POST /api/availability/interviewer/:interviewerId/overrides
// @access  Private
exports.addDateOverride = async (req, res, next) => {
  try {
    const { date, isUnavailable, slots, reason } = req.body;

    let availability = await Availability.findOne({ interviewer: req.params.interviewerId });
    if (!availability) {
      availability = new Availability({ interviewer: req.params.interviewerId });
    }

    // Remove any existing override for the same date
    availability.overrides = availability.overrides.filter((o) => o.date !== date);

    // Push new override
    availability.overrides.push({
      date,
      isUnavailable: isUnavailable ?? true,
      slots: slots || [],
      reason: reason || 'Scheduled Time Off',
    });

    await availability.save();

    res.status(200).json({ success: true, availability });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete date override
// @route   DELETE /api/availability/interviewer/:interviewerId/overrides/:date
// @access  Private
exports.removeDateOverride = async (req, res, next) => {
  try {
    const availability = await Availability.findOne({ interviewer: req.params.interviewerId });
    if (!availability) return res.status(404).json({ success: false, message: 'Availability not found' });

    availability.overrides = availability.overrides.filter((o) => o.date !== req.params.date);
    await availability.save();

    res.status(200).json({ success: true, availability });
  } catch (err) {
    next(err);
  }
};

