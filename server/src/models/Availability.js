const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String, // "09:00"
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (24h)'],
    },
    endTime: {
      type: String, // "17:00"
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm (24h)'],
    },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      required: true,
      min: 0,
      max: 6,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    slots: [timeSlotSchema],
  },
  { _id: false }
);

const overrideSchema = new mongoose.Schema(
  {
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'],
    },
    isUnavailable: {
      type: Boolean,
      default: true, // true if completely off that day
    },
    slots: [timeSlotSchema], // custom available slots for that day if not completely unavailable
    reason: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interviewer',
      required: true,
      unique: true,
      index: true,
    },
    timezone: {
      type: String,
      default: 'America/Los_Angeles',
    },
    weeklySchedule: {
      type: [dayScheduleSchema],
      default: () => [
        { dayOfWeek: 1, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] }, // Mon
        { dayOfWeek: 2, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] }, // Tue
        { dayOfWeek: 3, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] }, // Wed
        { dayOfWeek: 4, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '17:00' }] }, // Thu
        { dayOfWeek: 5, isAvailable: true, slots: [{ startTime: '09:00', endTime: '12:00' }, { startTime: '13:00', endTime: '16:00' }] }, // Fri
        { dayOfWeek: 6, isAvailable: false, slots: [] }, // Sat
        { dayOfWeek: 0, isAvailable: false, slots: [] }, // Sun
      ],
    },
    overrides: {
      type: [overrideSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Availability', availabilitySchema);

