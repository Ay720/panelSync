const InterviewPanel = require('../models/InterviewPanel');
const { logAction } = require('../utils/logger');

// @desc    Get all interview panels
// @route   GET /api/panels
// @access  Private
exports.getPanels = async (req, res, next) => {
  try {
    const { department, search } = req.query;
    const query = { isActive: true };

    if (department && department !== 'all') query.department = department;
    if (search) query.name = { $regex: search, $options: 'i' };

    const panels = await InterviewPanel.find(query)
      .populate('interviewers.interviewer', 'name email title department seniority timezone')
      .sort({ name: 1 });

    res.status(200).json({ success: true, count: panels.length, panels });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single interview panel
// @route   GET /api/panels/:id
// @access  Private
exports.getPanelById = async (req, res, next) => {
  try {
    const panel = await InterviewPanel.findById(req.params.id).populate(
      'interviewers.interviewer',
      'name email title department seniority timezone'
    );
    if (!panel) return res.status(404).json({ success: false, message: 'Panel not found' });
    res.status(200).json({ success: true, panel });
  } catch (err) {
    next(err);
  }
};

// @desc    Create interview panel
// @route   POST /api/panels
// @access  Private (Admin / HR)
exports.createPanel = async (req, res, next) => {
  try {
    const panel = await InterviewPanel.create(req.body);

    await logAction({
      action: 'PANEL_CREATED',
      performedBy: req.user._id,
      targetEntity: 'InterviewPanel',
      targetId: panel._id.toString(),
      details: { name: panel.name, department: panel.department },
    });

    res.status(201).json({ success: true, panel });
  } catch (err) {
    next(err);
  }
};

// @desc    Update interview panel
// @route   PUT /api/panels/:id
// @access  Private (Admin / HR)
exports.updatePanel = async (req, res, next) => {
  try {
    const panel = await InterviewPanel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('interviewers.interviewer', 'name email title department seniority');

    if (!panel) return res.status(404).json({ success: false, message: 'Panel not found' });
    res.status(200).json({ success: true, panel });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete interview panel
// @route   DELETE /api/panels/:id
// @access  Private (Admin / HR)
exports.deletePanel = async (req, res, next) => {
  try {
    const panel = await InterviewPanel.findById(req.params.id);
    if (!panel) return res.status(404).json({ success: false, message: 'Panel not found' });

    panel.isActive = false;
    await panel.save();

    res.status(200).json({ success: true, message: 'Panel deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

