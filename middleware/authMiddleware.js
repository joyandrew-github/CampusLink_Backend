const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Protect middleware - Decoded token:', { id: decoded.id, role: decoded.role });
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        console.error('Protect middleware - User not found for ID:', decoded.id);
        res.status(401);
        throw new Error('Not authorized, user not found');
      }
      next();
    } catch (error) {
      console.error('Protect middleware - Token validation failed:', error.message, { token: token?.substring(0, 20) + '...' });
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    console.error('Protect middleware - No token provided');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    console.log('Admin middleware - User authorized:', { userId: req.user._id, role: req.user.role });
    next();
  } else {
    console.error('Admin middleware - Not authorized as admin:', { userId: req.user?._id, role: req.user?.role });
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

const student = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    console.log('Student middleware - User authorized:', { userId: req.user._id, role: req.user.role });
    next();
  } else {
    console.error('Student middleware - Not authorized as student:', { userId: req.user?._id, role: req.user?.role });
    res.status(401);
    throw new Error('Not authorized as a student');
  }
};

module.exports = { protect, admin, student };