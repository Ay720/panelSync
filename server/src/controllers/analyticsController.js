const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const Interviewer = require('../models/Interviewer');
const AuditLog = require('../models/AuditLog');
const { startOfDay, endOfDay, addDays, subDays } = require('date-fns');

// @desc    Get top-level dashboard metrics & recent activity
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalInterviews,
      upcomingInterviews,
      completedInterviews,
      scheduledInterviews,
      cancelledInterviews,
      rescheduledInterviews,
      totalCandidates,
      totalInterviewers,
      recentActivities,
      upcomingList,
    ] = await Promise.all([
      Interview.countDocuments(),
      Interview.countDocuments({
        status: { $in: ['scheduled', 'rescheduled'] },
        scheduledStartTime: { $gte: now },
      }),
      Interview.countDocuments({ status: 'completed' }),
      Interview.countDocuments({ status: 'scheduled' }),
      Interview.countDocuments({ status: 'cancelled' }),
      Interview.countDocuments({ 'rescheduleHistory.0': { $exists: true } }),
      Candidate.countDocuments(),
      Interviewer.countDocuments({ isActive: true }),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('performedBy', 'name email role'),
      Interview.find({
        status: { $in: ['scheduled', 'rescheduled'] },
        scheduledStartTime: { $gte: now },
      })
        .sort({ scheduledStartTime: 1 })
        .limit(5)
        .populate('candidate', 'name jobRole email')
        .populate('interviewers.interviewer', 'name title department'),
    ]);

    // Candidates by stage
    const candidatePipeline = await Candidate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      metrics: {
        totalInterviews,
        upcomingInterviews,
        completedInterviews,
        scheduledInterviews,
        cancelledInterviews,
        rescheduledInterviews,
        totalCandidates,
        totalInterviewers,
      },
      candidatePipeline: candidatePipeline.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      recentActivities,
      upcomingInterviewsList: upcomingList,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed scheduling analytics & workload distribution
// @route   GET /api/analytics/detailed
// @access  Private
exports.getDetailedAnalytics = async (req, res, next) => {
  try {
    // 1. Interviews by round type
    const byRoundType = await Interview.aggregate([
      { $group: { _id: '$roundType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 2. Interviews by status
    const byStatus = await Interview.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 3. Interviewer load distribution (top interviewers by number of panels)
    const interviewerWorkload = await Interview.aggregate([
      { $unwind: '$interviewers' },
      {
        $group: {
          _id: '$interviewers.interviewer',
          interviewCount: { $sum: 1 },
        },
      },
      { $sort: { interviewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'interviewers',
          localField: '_id',
          foreignField: '_id',
          as: 'interviewerInfo',
        },
      },
      { $unwind: '$interviewerInfo' },
      {
        $project: {
          interviewerId: '$_id',
          name: '$interviewerInfo.name',
          department: '$interviewerInfo.department',
          title: '$interviewerInfo.title',
          interviewCount: 1,
        },
      },
    ]);

    // 4. Interviews scheduled in last 7 days
    const pastDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dayStart = startOfDay(d);
      const dayEnd = endOfDay(d);

      const count = await Interview.countDocuments({
        createdAt: { $gte: dayStart, $lte: dayEnd },
      });

      pastDays.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count,
      });
    }

    res.status(200).json({
      success: true,
      byRoundType,
      byStatus,
      interviewerWorkload,
      trendsPastWeek: pastDays,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Export interview data as CSV report
// @route   GET /api/analytics/export-csv
// @access  Private
exports.exportCSV = async (req, res, next) => {
  try {
    const interviews = await Interview.find()
      .populate('candidate', 'name email jobRole')
      .populate('interviewers.interviewer', 'name email department')
      .sort({ scheduledStartTime: -1 });

    const csvRows = [
      ['Interview ID', 'Title', 'Candidate Name', 'Candidate Email', 'Job Role', 'Round Type', 'Status', 'Start Time UTC', 'Duration (Mins)', 'Interviewers', 'Notes'],
    ];

    interviews.forEach((i) => {
      const invNames = i.interviewers?.map((p) => p.interviewer?.name || 'Panelist').join('; ');
      csvRows.push([
        `"${i._id}"`,
        `"${(i.title || '').replace(/"/g, '""')}"`,
        `"${(i.candidate?.name || '').replace(/"/g, '""')}"`,
        `"${(i.candidate?.email || '').replace(/"/g, '""')}"`,
        `"${(i.jobRole || '').replace(/"/g, '""')}"`,
        `"${i.roundType || ''}"`,
        `"${i.status || ''}"`,
        `"${new Date(i.scheduledStartTime).toISOString()}"`,
        i.durationMinutes || 60,
        `"${invNames.replace(/"/g, '""')}"`,
        `"${(i.feedbackNotes || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = csvRows.map((r) => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="panelsync-analytics-report.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
};

