// const express = require('express');
// require('dotenv').config({ path: './.env' });
// const connectDB = require('./config/db');
// const authRoutes = require('./routes/authRoutes');

// // dotenv.config();
// connectDB();

// const app = express();

// app.use(express.json());

// app.use('/api/auth', authRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
//   res.status(statusCode).json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'production' ? null : err.stack,
//   });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


const express = require('express');
require('dotenv').config({ path: './.env' });
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const lostFoundRoutes = require('./routes/lostFoundRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const cors = require('cors');


connectDB();

const app = express();

app.use(cors());

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/complaints', complaintRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));