const asyncHandler = require('express-async-handler');
const LostFound = require('../models/LostFound');
const cloudinary = require('../config/cloudinary');

// Create lost/found item (Student only)
const createLostFound = asyncHandler(async (req, res) => {
  const { itemName, description, category, status, location, date, otherCategory } = req.body;
  const file = req.file;

  // Validate otherCategory
  if (category === 'other' && !otherCategory) {
    res.status(400);
    throw new Error('Other category is required when category is "other"');
  }
  if (category !== 'other' && otherCategory) {
    res.status(400);
    throw new Error('Other category must be empty when category is not "other"');
  }

  // Handle image upload if provided
  let image = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/lostfound' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      image = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload item image');
    }
  }

  const lostFound = await LostFound.create({
    itemName,
    description,
    category,
    otherCategory: category === 'other' ? otherCategory : '',
    status,
    image,
    location,
    date,
    postedBy: req.user._id,
    foundBy: null,
  });

  const populatedLostFound = await LostFound.findById(lostFound._id)
    .populate('postedBy', 'name')
    .populate('foundBy', 'name');
  res.status(201).json(populatedLostFound);
});

// Get all lost/found items (Students and Admins)
const getLostFound = asyncHandler(async (req, res) => {
  const { category, status, otherCategory, sortBy } = req.query;
  let query = {};

  if (category) query.category = category;
  if (status) query.status = status;
  if (otherCategory) query.otherCategory = otherCategory;

  // Ensure postedBy exists
  query.postedBy = { $ne: null, $exists: true };

  const sortOptions = sortBy === 'oldest' ? { date: 1 } : { date: -1 };
  const lostFounds = await LostFound.find(query)
    .populate('postedBy', 'name')
    .populate('foundBy', 'name')
    .sort(sortOptions);

  res.json(lostFounds);
});

// Get single lost/found item by ID (Students and Admins)
const getLostFoundById = asyncHandler(async (req, res) => {
  const lostFound = await LostFound.findById(req.params.id)
    .populate('postedBy', 'name')
    .populate('foundBy', 'name');
  if (!lostFound) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (!lostFound.postedBy) {
    res.status(404);
    throw new Error('Item has invalid poster reference');
  }
  res.json(lostFound);
});

// Update lost/found item (Student who posted or Admin)
const updateLostFound = asyncHandler(async (req, res) => {
  const { itemName, description, category, status, location, date, otherCategory } = req.body;
  const file = req.file;

  const lostFound = await LostFound.findById(req.params.id);
  if (!lostFound) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (!lostFound.postedBy) {
    res.status(404);
    throw new Error('Item has invalid poster reference');
  }

  // Authorization: Only poster or admin can update
  if (
    req.user.role === 'student' &&
    lostFound.postedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to update this item');
  }

  // Validate otherCategory
  if (category === 'other' && !otherCategory) {
    res.status(400);
    throw new Error('Other category is required when category is "other"');
  }
  if (category && category !== 'other' && otherCategory) {
    res.status(400);
    throw new Error('Other category must be empty when category is not "other"');
  }

  // Handle image upload if provided
  let image = lostFound.image;
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/lostfound' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      image = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload item image');
    }
  }

  lostFound.itemName = itemName || lostFound.itemName;
  lostFound.description = description || lostFound.description;
  lostFound.category = category || lostFound.category;
  lostFound.otherCategory = category === 'other' ? otherCategory : (category ? '' : lostFound.otherCategory);
  lostFound.status = status || lostFound.status;
  lostFound.location = location || lostFound.location;
  lostFound.date = date || lostFound.date;
  lostFound.image = image;

  await lostFound.save();
  const populatedLostFound = await LostFound.findById(lostFound._id)
    .populate('postedBy', 'name')
    .populate('foundBy', 'name');
  res.json(populatedLostFound);
});

// Mark item as found (Any Student)
const markAsFound = asyncHandler(async (req, res) => {
  const lostFound = await LostFound.findById(req.params.id);
  if (!lostFound) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (!lostFound.postedBy) {
    res.status(404);
    throw new Error('Item has invalid poster reference');
  }

  // Validate item is lost
  if (lostFound.status !== 'lost') {
    res.status(400);
    throw new Error('Item is already marked as found');
  }

  // Prevent overwriting foundBy
  if (lostFound.foundBy) {
    res.status(400);
    throw new Error('Item has already been claimed as found');
  }

  lostFound.status = 'found';
  lostFound.foundBy = req.user._id;

  await lostFound.save();
  const populatedLostFound = await LostFound.findById(req.params.id)
    .populate('postedBy', 'name')
    .populate('foundBy', 'name');
  res.json(populatedLostFound);
});

// Delete lost/found item (Student who posted or Admin)
const deleteLostFound = asyncHandler(async (req, res) => {
  const lostFound = await LostFound.findById(req.params.id);
  if (!lostFound) {
    res.status(404);
    throw new Error('Item not found');
  }
  if (!lostFound.postedBy) {
    res.status(404);
    throw new Error('Item has invalid poster reference');
  }

  if (
    req.user.role === 'student' &&
    lostFound.postedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to delete this item');
  }

  await lostFound.deleteOne();
  res.json({ message: 'Item deleted successfully' });
});

module.exports = {
  createLostFound,
  getLostFound,
  getLostFoundById,
  updateLostFound,
  markAsFound,
  deleteLostFound,
};