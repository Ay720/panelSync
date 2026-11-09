const mongoose = require('mongoose');

const interviewParticipantSchema = new mongoose.Schema(
  {
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interviewer',
      required: true,
    },
    role: {
      type: String,
      default: 'Interviewer',
    },
    responseStatus: {
      type: String,
      enum: ['accepted', 'pending', 'declined'],
      default: 'accepted',
    },
  },
  { _id: false }
);

const rescheduleLogSchema = new mongoose.Schema(
  {
    previousStartTime: { type: Date, required: true },
    previousEndTime: { type: Date, required: true },
    newStartTime: { type: Date, required: true },
    newEndTime: { type: Date, required: true },
    rescheduledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate is required'],
      index: true,
    },
    panel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewPanel',
      index: true,
    },
    interviewers: {
      type: [interviewParticipantSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'At least one interviewer must be assigned to the interview',
      },
    },
    title: {
      type: String,
      required: [true, 'Interview title is required'],
      trim: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
    },
    roundType: {
      type: String,
      enum: ['screening', 'technical', 'system_design', 'behavioral', 'bar_raiser', 'final'],
      default: 'technical',
      index: true,
    },
    scheduledStartTime: {
      type: Date,
      required: [true, 'Scheduled start time is required'],
      index: true,
    },
    scheduledEndTime: {
      type: Date,
      required: [true, 'Scheduled end time is required'],
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    meetingLink: {
      type: String,
      default: () => `https://meet.panelsync.io/room/${Math.random().toString(36).substring(2, 10)}`,
    },
    meetingLocation: {
      type: String,
      default: 'Virtual Video Conference (PanelSync Room)',
    },
    rescheduleHistory: {
      type: [rescheduleLogSchema],
      default: [],
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    feedbackNotes: {
      type: String,
      trim: true,
    },
    calendarEventIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CalendarEvent',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for schedule conflict queries and dashboard aggregation
interviewSchema.index({ scheduledStartTime: 1, scheduledEndTime: 1, status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);

