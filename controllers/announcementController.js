const asyncHandler = require('express-async-handler');
const Announcement = require('../models/Announcement');
const cloudinary = require('../config/cloudinary');

// Create announcement with optional image (Admin only)
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category, venue, time, startTime, endTime, date, registerLink } = req.body;
  const file = req.file;

  // Validate required fields
  if (!title || !description || !category) {
    res.status(400);
    throw new Error('Title, description, and category are required');
  }

  // Validate date format if provided (e.g., "2025-07-25")
  let parsedDate = null;
  if (date) {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400);
      throw new Error('Invalid date format. Use YYYY-MM-DD (e.g., 2025-07-25)');
    }
  }

  let image = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/announcements' },
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
      throw new Error('Failed to upload announcement image');
    }
  }

  const announcement = await Announcement.create({
    title,
    description,
    category,
    image,
    venue: venue || '',
    time: time || '', // Backward compatibility
    startTime: startTime || '',
    endTime: endTime || '',
    date: parsedDate,
    registerLink: registerLink || '',
    postedBy: req.user._id,
  });

  res.status(201).json(announcement);
});

// Get all announcements (Students and Admins)
const getAnnouncements = asyncHandler(async (req, res) => {
  const { category, sortBy } = req.query;
  let query = {};
  if (category) query.category = category;

  const sortOptions = sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const announcements = await Announcement.find(query)
    .populate('postedBy', 'name')
    .sort(sortOptions);

  res.json(announcements);
});

// Get single announcement by ID (Students and Admins)
const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id).populate('postedBy', 'name');
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }
  res.json(announcement);
});

// Update announcement with optional image (Admin only)
const updateAnnouncement = asyncHandler(async (req, res) => {
  const { title, description, category, venue, time, startTime, endTime, date, registerLink } = req.body;
  const file = req.file;

  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  // Validate date format if provided
  let parsedDate = announcement.date;
  if (date) {
    parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400);
      throw new Error('Invalid date format. Use YYYY-MM-DD (e.g., 2025-07-25)');
    }
  }

  let image = announcement.image;
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/announcements' },
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
      throw new Error('Failed to upload announcement image');
    }
  }

  announcement.title = title || announcement.title;
  announcement.description = description || announcement.description;
  announcement.category = category || announcement.category;
  announcement.image = image;
  announcement.venue = venue || announcement.venue;
  announcement.time = time || announcement.time; // Backward compatibility
  announcement.startTime = startTime || announcement.startTime;
  announcement.endTime = endTime || announcement.endTime;
  announcement.date = parsedDate || announcement.date;
  announcement.registerLink = registerLink || announcement.registerLink;

  await announcement.save();
  res.json(announcement);
});

// Delete announcement (Admin only)
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    res.status(404);
    throw new Error('Announcement not found');
  }

  await announcement.deleteOne();
  res.json({ message: 'Announcement deleted successfully' });
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};