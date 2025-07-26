const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('express-async-handler');

// Register Admin
const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, phoneNo, password, adminSecretKey } = req.body;
  const file = req.file;

  // Compare provided adminSecretKey with the hashed ADMIN_SECRET_KEY from .env
  const isSecretKeyValid = await bcrypt.compare(adminSecretKey, await bcrypt.hash(process.env.ADMIN_SECRET_KEY, 10));
  if (!isSecretKeyValid) {
    res.status(401);
    throw new Error('Invalid admin secret key');
  }

  let profileImage = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/profiles' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      profileImage = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload profile image');
    }
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    phoneNo,
    password,
    role: 'admin',
    adminSecretKey, // Will be hashed by the pre('save') hook
    profileImage,
  });

  if (user) {
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNo: user.phoneNo,
      profileImage: user.profileImage,
      token,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// Register Student (Admin only)
const registerStudent = asyncHandler(async (req, res) => {
  const { name, email, phoneNo, password, rollNo, dept, year, accommodation } = req.body;
  const file = req.file;

  let profileImage = '';
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/profiles' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      profileImage = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload profile image');
    }
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const rollNoExists = await User.findOne({ rollNo });
  if (rollNoExists) {
    res.status(400);
    throw new Error('Roll number already exists');
  }

  const user = await User.create({
    name,
    email,
    phoneNo,
    password,
    role: 'student',
    rollNo,
    dept,
    year,
    accommodation,
    profileImage,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNo: user.phoneNo,
      rollNo: user.rollNo,
      dept: user.dept,
      year: user.year,
      accommodation: user.accommodation,
      profileImage: user.profileImage,
    });
  } else {
    res.status(400);
    throw new Error('Invalid student data');
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    const token = generateToken(user._id, user.role);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNo: user.phoneNo,
      profileImage: user.profileImage,
      ...(user.role === 'student' && {
        rollNo: user.rollNo,
        dept: user.dept,
        year: user.year,
        accommodation: user.accommodation,
      }),
      token,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// Get User Profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -adminSecretKey');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNo: user.phoneNo,
    role: user.role,
    profileImage: user.profileImage,
    ...(user.role === 'student' && {
      rollNo: user.rollNo,
      dept: user.dept,
      year: user.year,
      accommodation: user.accommodation,
    }),
  });
});

// Get All Users (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password -adminSecretKey').lean();
  res.json(users);
});

// Update User (Admin only)
const updateUser = asyncHandler(async (req, res) => {
  const { name, email, phoneNo, rollNo, dept, year, accommodation } = req.body;
  const file = req.file;

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let profileImage = user.profileImage;
  if (file) {
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'campuslink/profiles' },
          (error, result) => {
            if (error) reject(error);
            resolve(result);
          }
        ).end(file.buffer);
      });
      profileImage = result.secure_url;
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      res.status(500);
      throw new Error('Failed to upload profile image');
    }
  }

  const userExists = await User.findOne({ email, _id: { $ne: user._id } });
  if (userExists) {
    res.status(400);
    throw new Error('Email already in use by another user');
  }

  const rollNoExists = rollNo && (await User.findOne({ rollNo, _id: { $ne: user._id } }));
  if (rollNoExists) {
    res.status(400);
    throw new Error('Roll number already in use by another user');
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.phoneNo = phoneNo || user.phoneNo;
  user.rollNo = rollNo || user.rollNo;
  user.dept = dept || user.dept;
  user.year = year || user.year;
  user.accommodation = accommodation || user.accommodation;
  user.profileImage = profileImage;

  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phoneNo: user.phoneNo,
    role: user.role,
    profileImage: user.profileImage,
    ...(user.role === 'student' && {
      rollNo: user.rollNo,
      dept: user.dept,
      year: user.year,
      accommodation: user.accommodation,
    }),
  });
});

// Delete User (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await user.deleteOne();
  res.json({ message: 'User deleted successfully' });
});

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = { registerAdmin, registerStudent, loginUser, getUserProfile, getAllUsers, updateUser, deleteUser };