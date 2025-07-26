const asyncHandler = require('express-async-handler');
const Timetable = require('../models/Timetable');

// Helper function to validate time format (HH:mm)
const isValidTimeFormat = (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);

// Helper function to check for time conflicts
const hasTimeConflict = (existingClasses, newClass, classId = null) => {
  return existingClasses.some(item => {
    if (classId && item.id === classId) return false; // Skip the class being edited
    return (
      (newClass.startTime >= item.startTime && newClass.startTime < item.endTime) ||
      (newClass.endTime > item.startTime && newClass.endTime <= item.endTime) ||
      (newClass.startTime <= item.startTime && newClass.endTime >= item.endTime)
    );
  });
};

// Create or add a class to the timetable (Students only)
const addClass = asyncHandler(async (req, res) => {
  const { weekIndex, day, subject, professor, startTime, endTime, room, type, date } = req.body;

  if (!Number.isInteger(weekIndex) || !day || !subject || !professor || !startTime || !endTime || !room || !type || !date) {
    res.status(400);
    throw new Error('All fields are required');
  }

  if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)) {
    res.status(400);
    throw new Error('Invalid day');
  }

  if (!['Lecture', 'Lab', 'Tutorial', 'Seminar'].includes(type)) {
    res.status(400);
    throw new Error('Invalid class type');
  }

  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    res.status(400);
    throw new Error('Invalid time format. Use HH:mm');
  }

  const classDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  if (isNaN(classDate.getTime()) || classDate < today) {
    res.status(400);
    throw new Error('Invalid or past date. Date must be today or in the future');
  }

  let timetable = await Timetable.findOne({ user: req.user._id });
  if (!timetable) {
    timetable = await Timetable.create({
      user: req.user._id,
      schedule: [],
    });
  }

  // Ensure schedule has enough weeks
  while (timetable.schedule.length <= weekIndex) {
    timetable.schedule.push({
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [],
    });
  }

  const newClass = {
    id: Date.now().toString(), // Match frontend's ID generation
    subject,
    professor,
    startTime,
    endTime,
    room,
    type,
    date,
    status: 'scheduled',
  };

  // Check for time conflicts
  const existingClasses = timetable.schedule[weekIndex][day] || [];
  if (hasTimeConflict(existingClasses, newClass)) {
    res.status(400);
    throw new Error('Time conflict with an existing class');
  }

  timetable.schedule[weekIndex][day].push(newClass);
  await timetable.save();
  res.status(201).json(timetable);
});

// Edit a specific class in the timetable (Students only)
const editClass = asyncHandler(async (req, res) => {
  const { weekIndex, day, id, subject, professor, startTime, endTime, room, type, date } = req.body;

  if (!Number.isInteger(weekIndex) || !day || !id || !subject || !professor || !startTime || !endTime || !room || !type || !date) {
    res.status(400);
    throw new Error('All fields are required');
  }

  if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)) {
    res.status(400);
    throw new Error('Invalid day');
  }

  if (!['Lecture', 'Lab', 'Tutorial', 'Seminar'].includes(type)) {
    res.status(400);
    throw new Error('Invalid class type');
  }

  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    res.status(400);
    throw new Error('Invalid time format. Use HH:mm');
  }

  const classDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  if (isNaN(classDate.getTime()) || classDate < today) {
    res.status(400);
    throw new Error('Invalid or past date. Date must be today or in the future');
  }

  const timetable = await Timetable.findOne({ user: req.user._id });
  if (!timetable || !timetable.schedule[weekIndex] || !timetable.schedule[weekIndex][day]) {
    res.status(404);
    throw new Error('Timetable or class not found');
  }

  const newClass = {
    id,
    subject,
    professor,
    startTime,
    endTime,
    room,
    type,
    date,
    status: 'scheduled', // Reset status to 'scheduled' on edit (or retain existing status if admin-managed)
  };

  // Check for time conflicts
  const existingClasses = timetable.schedule[weekIndex][day];
  if (hasTimeConflict(existingClasses, newClass, id)) {
    res.status(400);
    throw new Error('Time conflict with another class');
  }

  timetable.schedule[weekIndex][day] = timetable.schedule[weekIndex][day].map(item =>
    item.id === id ? newClass : item
  );
  await timetable.save();
  res.json(timetable);
});

// Update class status (Admins only)
const updateClassStatus = asyncHandler(async (req, res) => {
  const { weekIndex, day, id, status } = req.body;

  if (!Number.isInteger(weekIndex) || !day || !id || !status) {
    res.status(400);
    throw new Error('Week index, day, class ID, and status are required');
  }

  if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)) {
    res.status(400);
    throw new Error('Invalid day');
  }

  if (!['scheduled', 'cancelled', 'rescheduled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only admins can update class status');
  }

  const timetable = await Timetable.findOne({ user: req.user._id });
  if (!timetable || !timetable.schedule[weekIndex] || !timetable.schedule[weekIndex][day]) {
    res.status(404);
    throw new Error('Timetable or class not found');
  }

  const classItem = timetable.schedule[weekIndex][day].find(item => item.id === id);
  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  classItem.status = status;
  await timetable.save();
  res.json(timetable);
});

// Get timetable (Students only)
const getTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findOne({ user: req.user._id });
  if (!timetable) {
    res.status(404);
    throw new Error('Timetable not found');
  }
  res.json(timetable);
});

// Delete a class from the timetable (Students only)
const deleteClass = asyncHandler(async (req, res) => {
  const { weekIndex, day, id } = req.body;

  if (!Number.isInteger(weekIndex) || !day || !id) {
    res.status(400);
    throw new Error('Week index, day, and class ID are required');
  }

  if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)) {
    res.status(400);
    throw new Error('Invalid day');
  }

  const timetable = await Timetable.findOne({ user: req.user._id });
  if (!timetable || !timetable.schedule[weekIndex] || !timetable.schedule[weekIndex][day]) {
    res.status(404);
    throw new Error('Timetable or class not found');
  }

  timetable.schedule[weekIndex][day] = timetable.schedule[weekIndex][day].filter(item => item.id !== id);
  await timetable.save();
  res.json(timetable);
});

module.exports = { addClass, editClass, updateClassStatus, getTimetable, deleteClass };