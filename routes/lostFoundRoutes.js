const express = require('express');
const router = express.Router();
const {
  createLostFound,
  getLostFound,
  getLostFoundById,
  updateLostFound,
  markAsFound,
  deleteLostFound,
} = require('../controllers/lostFoundController');
const { protect, student } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/', protect, student, upload.single('image'), createLostFound);
router.get('/', protect, getLostFound);
router.get('/:id', protect, getLostFoundById);
router.put('/:id', protect, upload.single('image'), updateLostFound);
router.put('/:id/found', protect, markAsFound);
router.delete('/:id', protect, deleteLostFound);

module.exports = router;