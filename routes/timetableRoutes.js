const express = require('express');
const router = express.Router();
const { addClass, editClass, updateClassStatus, getTimetable, deleteClass } = require('../controllers/timetableController');
const { protect, student, admin } = require('../middleware/authMiddleware');

router.post('/class', protect, student, addClass); // Add a new class
router.put('/class', protect, student, editClass); // Edit a specific class
router.put('/class/status', protect, admin, updateClassStatus); // Update class status (admin only)
router.get('/', protect, student, getTimetable); // Get timetable
router.delete('/class', protect, student, deleteClass); // Delete a class

module.exports = router;