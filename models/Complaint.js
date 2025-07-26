const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  room: {
    type: String,
    required: [true, 'Room number is required'],
    trim: true,
  },
  category: {
    type: String,
    enum: [
      'cleaning',
      'maintenance',
      'food',
      'noise',
      'staff',
      'water',
      'electricity',
      'wifi issue',
      'room condition',
      'washroom issue',
      'laundry',
      'security',
      'pest control',
      'air conditioning',
      'fan or light not working',
      'bed or furniture damage',
      'mess timing',
      'power backup',
      'waste disposal',
      'drinking water',
      'plumbing',
      'other'
    ],
    required: [true, 'Category is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved'],
    default: 'pending',
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);