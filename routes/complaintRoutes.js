const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createComplaint);
router.get('/', protect, getComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id', protect, updateComplaint);
router.delete('/:id', protect, deleteComplaint);

module.exports = router;