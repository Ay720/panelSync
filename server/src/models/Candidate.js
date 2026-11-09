const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email'],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    jobRole: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
      default: 'Engineering',
    },
    status: {
      type: String,
      enum: ['applied', 'screening', 'interview_scheduled', 'interview_completed', 'offered', 'rejected'],
      default: 'applied',
      index: true,
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    preferredDateRange: {
      start: { type: Date },
      end: { type: Date },
    },
    preferredTimesOfDay: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening', 'any'],
      default: ['any'],
    },
    resumeUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    interviewHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interview',
      },
    ],
  },
  {
    timestamps: true,
  }
);

candidateSchema.index({ name: 'text', jobRole: 'text', email: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);

