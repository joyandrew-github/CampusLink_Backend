const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    enum: ['General', 'Event', 'Exam', 'Holiday', 'Hackathon', 'Internship', 'Tech News'],
    required: [true, 'Category is required'],
  },
  image: {
    type: String,
    default: '',
  },
  venue: {
    type: String,
    default: '',
  },
  time: {
    type: String,
    default: '', // Kept for backward compatibility; consider deprecating if not needed
  },
  startTime: {
    type: String, // e.g., "10:00 AM"
    default: '',
  },
  endTime: {
    type: String, // e.g., "12:00 PM"
    default: '',
  },
  date: {
    type: Date, // Stored as Date for querying/sorting
    default: null,
  },
  registerLink: {
    type: String,
    default: '',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Optional: Format date as "25th July 2025" when converting to JSON
announcementSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.date) {
      const date = new Date(ret.date);
      const day = date.getDate();
      const month = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();
      const suffix = getDaySuffix(day);
      ret.date = `${day}${suffix} ${month} ${year}`; // e.g., "25th July 2025"
    }
    return ret;
  },
});

// Helper function to get day suffix (e.g., "st", "nd", "rd", "th")
function getDaySuffix(day) {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

module.exports = mongoose.model('Announcement', announcementSchema);