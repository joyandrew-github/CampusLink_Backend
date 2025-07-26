const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  category: {
    type: String,
    enum: ['electronics', 'books', 'clothing', 'personal', 'other'],
    required: [true, 'Category is required'],
  },
  otherCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Other category must not exceed 50 characters'],
    validate: {
      validator: function (value) {
        return this.category === 'other' ? !!value : !value;
      },
      message: 'Other category is required when category is "other", and must be empty otherwise',
    },
  },
  status: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Status is required'],
  },
  image: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foundBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('LostFound', lostFoundSchema);
