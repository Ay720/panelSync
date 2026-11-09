const mongoose = require('mongoose');

const panelMemberSchema = new mongoose.Schema(
  {
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interviewer',
      required: true,
    },
    role: {
      type: String,
      default: 'Lead Interviewer', // e.g., 'Primary Evaluator', 'Bar Raiser', 'System Design Expert', 'Culture Fit'
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const interviewPanelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Panel name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'Engineering',
      index: true,
    },
    targetRole: {
      type: String,
      trim: true,
    },
    interviewers: [panelMemberSchema],
    defaultDurationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 240,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InterviewPanel', interviewPanelSchema);

