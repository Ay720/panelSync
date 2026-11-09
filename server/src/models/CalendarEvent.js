const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema(
  {
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interviewer',
      required: true,
      index: true,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      index: true,
    },
    externalEventId: {
      type: String,
      index: true,
    },
    source: {
      type: String,
      enum: ['internal', 'google', 'outlook', 'mock'],
      default: 'internal',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Busy',
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
      required: true,
      index: true,
    },
    isBusy: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for high performance overlap checking
calendarEventSchema.index({ interviewer: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);

