const asyncHandler = require('express-async-handler');
const axios = require('axios');
const Complaint = require('../models/Complaint');

// Create complaint with AI categorization (Students)
const createComplaint = asyncHandler(async (req, res) => {
  const { title, description, room } = req.body;

  // Validate required fields
  if (!title || !description || !room) {
    res.status(400);
    throw new Error('Title, description, and room are required');
  }

  // Call AI model to categorize complaint
  let category = 'other';
  try {
    console.log('Sending AI model request:', { complaint: description });
    const aiResponse = await axios.post(process.env.AI_MODEL_URL, {
      complaint: description,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000, // 10-second timeout
    });
    console.log('AI model response:', aiResponse.data);

    category = aiResponse.data.label || 'other';
    const validCategories = [
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
    ];
    if (!validCategories.includes(category)) {
      console.warn(`Invalid category from AI model: ${category}, defaulting to 'other'`);
      category = 'other';
    }
  } catch (error) {
    console.error('AI Model Error:', error.message, error.response?.data || '');
    // Continue with default category if AI fails
  }

  const complaint = await Complaint.create({
    title,
    description,
    room,
    category,
    submittedBy: req.user._id,
  });

  // Populate the submittedBy field with the user's name
  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate('submittedBy', 'name')
    .lean(); // Convert to plain JavaScript object for cleaner response

  // Ensure submittedBy has a fallback name if population fails
  res.status(201).json({
    ...populatedComplaint,
    submittedBy: populatedComplaint.submittedBy || { _id: req.user._id, name: 'Unknown' },
  });
});

// Get all complaints (Admins) or user's complaints (Students)
const getComplaints = asyncHandler(async (req, res) => {
  const { status, category } = req.query;
  let query = {};
  if (req.user.role === 'student') {
    query.submittedBy = req.user._id; // Students see only their complaints
  }
  if (status) query.status = status;
  if (category) query.category = category;

  const complaints = await Complaint.find(query)
    .populate('submittedBy', 'name')
    .sort({ createdAt: -1 });

  res.json(complaints);
});

// Get single complaint by ID (Admins or complaint owner)
const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('submittedBy', 'name');
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }
  if (
    req.user.role === 'student' &&
    complaint.submittedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to view this complaint');
  }
  res.json(complaint);
});

// Update complaint (Admins can update status only, Students can update title, description, room)
const updateComplaint = asyncHandler(async (req, res) => {
  const { title, description, room, status } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Authorization: Admins or complaint owner
  if (
    req.user.role === 'student' &&
    complaint.submittedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to update this complaint');
  }

  // For admins: only allow status updates
  if (req.user.role === 'admin') {
    if (title || description || room) {
      res.status(400);
      throw new Error('Admins can only update the status field');
    }
    if (!status) {
      res.status(400);
      throw new Error('Status is required for admin updates');
    }

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }

    complaint.status = status;
  }

  // For students: allow updating title, description, room, but not status
  if (req.user.role === 'student') {
    if (status) {
      res.status(401);
      throw new Error('Students cannot update complaint status');
    }

    // Re-run AI categorization if description changes
    let updatedCategory = complaint.category;
    if (description && description !== complaint.description) {
      try {
        console.log('Sending AI model request for update:', { complaint: description });
        const aiResponse = await axios.post(process.env.AI_MODEL_URL, {
          complaint: description,
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        });
        console.log('AI model response for update:', aiResponse.data);

        updatedCategory = aiResponse.data.label || 'other';
        const validCategories = [
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
        ];
        if (!validCategories.includes(updatedCategory)) {
          console.warn(`Invalid category from AI model: ${updatedCategory}, defaulting to 'other'`);
          updatedCategory = 'other';
        }
      } catch (error) {
        console.error('AI Model Error during update:', error.message, error.response?.data || '');
        // Keep existing category if AI fails
      }
    }

    // Update complaint fields for students
    complaint.title = title || complaint.title;
    complaint.description = description || complaint.description;
    complaint.room = room || complaint.room;
    complaint.category = updatedCategory;
  }

  // Save the updated complaint
  await complaint.save();

  // Fetch the updated complaint with populated submittedBy field
  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate('submittedBy', 'name')
    .lean();

  // Ensure submittedBy has a fallback name if population fails
  res.json({
    ...populatedComplaint,
    submittedBy: populatedComplaint.submittedBy || { _id: req.user._id, name: 'Unknown' },
  });
});

// Delete complaint (Admins or complaint owner)
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    res.status(404);
    throw new Error('Complaint not found');
  }

  // Authorization: Admins or complaint owner
  if (
    req.user.role === 'student' &&
    complaint.submittedBy._id.toString() !== req.user._id.toString()
  ) {
    res.status(401);
    throw new Error('Not authorized to delete this complaint');
  }

  await complaint.deleteOne();
  res.json({ message: 'Complaint deleted successfully' });
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
};