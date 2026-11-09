const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const { logAction } = require('../utils/logger');

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

