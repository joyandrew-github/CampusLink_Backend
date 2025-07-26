const express = require('express');
const router = express.Router();
const { registerAdmin, registerStudent, loginUser, getUserProfile, getAllUsers, updateUser, deleteUser } = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

router.post('/admin/register', upload.single('profileImage'), registerAdmin);
router.post('/student/register', protect, admin, upload.single('profileImage'), registerStudent);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, admin, getAllUsers);
router.put('/users/:id', protect, admin, upload.single('profileImage'), updateUser);
router.delete('/users/:id', protect, admin, deleteUser);

module.exports = router;