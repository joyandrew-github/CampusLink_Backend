// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   profileImage: {
//     type: String,
//     default: '',
//   },
//   name: {
//     type: String,
//     required: [true, 'Name is required'],
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
//   },
//   phoneNo: {
//     type: String,
//     required: [true, 'Phone number is required'],
//     match: [/^\d{10}$/, 'Phone number must be 10 digits'],
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: 6,
//   },
//   role: {
//     type: String,
//     enum: ['admin', 'student'],
//     required: true,
//   },
//   // Admin-specific fields
//   adminSecretKey: {
//     type: String,
//     required: function() { return this.role === 'admin'; },
//   },
//   // Student-specific fields
//   rollNo: {
//     type: String,
//     unique: true,
//     sparse: true,
//     required: function() { return this.role === 'student'; },
//   },
//   dept: {
//     type: String,
//     required: function() { return this.role === 'student'; },
//   },
//   year: {
//     type: Number,
//     required: function() { return this.role === 'student'; },
//     min: 1,
//     max: 4,
//   },
//   accommodation: {
//     type: String,
//     enum: ['dayscholar', 'hosteller'],
//     required: function() { return this.role === 'student'; },
//   },
// }, { timestamps: true });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Compare password method
// userSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  profileImage: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
  },
  phoneNo: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Phone number must be 10 digits'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    required: true,
  },
  // Admin-specific fields
  adminSecretKey: {
    type: String,
    required: function() { return this.role === 'admin'; },
  },
  // Student-specific fields
  rollNo: {
    type: String,
    unique: true,
    sparse: true,
    required: function() { return this.role === 'student'; },
  },
  dept: {
    type: String,
    required: function() { return this.role === 'student'; },
  },
  year: {
    type: Number,
    required: function() { return this.role === 'student'; },
    min: 1,
    max: 4,
  },
  accommodation: {
    type: String,
    enum: ['Dayscholar', 'Hosteller'],
    required: function() { return this.role === 'student'; },
  },
}, { timestamps: true });

// Hash password and adminSecretKey before saving
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // Hash adminSecretKey if modified and role is admin
  if (this.isModified('adminSecretKey') && this.role === 'admin') {
    const salt = await bcrypt.genSalt(10);
    this.adminSecretKey = await bcrypt.hash(this.adminSecretKey, salt);
  }
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);