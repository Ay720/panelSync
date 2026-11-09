const mongoose = require('mongoose');

const interviewerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Interviewer name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
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
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    seniority: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'lead', 'director', 'vp'],
      default: 'senior',
      index: true,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    timezone: {
      type: String,
      default: 'America/Los_Angeles',
    },
    maxInterviewsPerDay: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    maxInterviewsPerWeek: {
      type: Number,
      default: 10,
      min: 1,
      max: 40,
    },
    bufferTimeMinutes: {
      type: Number,
      default: 15, // Required break between interviews
      min: 0,
      max: 60,
    },
    calendarSync: {
      provider: {
        type: String,
        enum: ['google', 'outlook', 'none'],
        default: 'google',
      },
      syncStatus: {
        type: String,
        enum: ['connected', 'disconnected', 'syncing', 'error'],
        default: 'connected',
      },
      email: {
        type: String,
        trim: true,
      },
      lastSyncedAt: {
        type: Date,
        default: Date.now,
      },
      mockMode: {
        type: Boolean,
        default: true,
      },
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

interviewerSchema.index({ name: 'text', department: 'text', skills: 'text' });

module.exports = mongoose.model('Interviewer', interviewerSchema);

