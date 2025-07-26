const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  id: { type: String, required: true }, // Unique ID for the class (generated as Date.now() in frontend)
  subject: { type: String, required: true },
  professor: { type: String, required: true },
  startTime: { type: String, required: true }, // Format: HH:mm (e.g., "09:00")
  endTime: { type: String, required: true }, // Format: HH:mm (e.g., "10:00")
  room: { type: String, required: true },
  type: { type: String, enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar'], required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD (e.g., "2025-07-01")
  status: { type: String, enum: ['scheduled', 'cancelled', 'rescheduled'], default: 'scheduled' }, // Added for admin updates
});

const daySchema = new mongoose.Schema({
  Monday: [classSchema],
  Tuesday: [classSchema],
  Wednesday: [classSchema],
  Thursday: [classSchema],
  Friday: [classSchema],
  Saturday: [classSchema],
  Sunday: [classSchema],
});

const timetableSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schedule: [daySchema], // Array of weeks, each containing day objects
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);