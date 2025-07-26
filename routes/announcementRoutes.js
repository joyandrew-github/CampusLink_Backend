const express = require('express');
const router = express.Router();
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', protect, admin, upload.single('image'), createAnnouncement);
router.get('/', protect, getAnnouncements);
router.get('/:id', protect, getAnnouncementById);
router.put('/:id', protect, admin, upload.single('image'), updateAnnouncement);
router.delete('/:id', protect, admin, deleteAnnouncement);

module.exports = router;