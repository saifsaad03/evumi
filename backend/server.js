require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Production Security Headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Allows inline scripts/styles for API flexibility
}));

// CORS Configuration - Supports local dev and production deployment
const frontendUrl = (process.env.FRONTEND_URL || '').trim();
const allowedOrigins = [
  frontendUrl,
  frontendUrl.replace(/\/$/, ''),
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in preview/testing, or specify callback(new Error('CORS blocked'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth & OTP Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/assign', require('./routes/assignRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Land Management Modules (P3, P4, P5, Seed)
app.use('/api', require('./routes/p3Routes'));
app.use('/api', require('./routes/p4Routes'));
app.use('/api', require('./routes/p5Routes'));
app.use('/api', require('./routes/seedRoutes'));

// Health check & Production Status
const healthResponse = (req, res) => {
  res.json({
    status: 'online',
    system: '🏛️ e-ভূমি ডিজিটাল ভূমি ব্যবস্থাপনা প্ল্যাটফর্ম',
    version: '2.0.26',
    emailServiceConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com'),
    roles: ['User', 'Register Office', 'AC Land Office', 'Super Admin'],
    modules: ['P3 Fraud Detection', 'P4 e-Mutation & Registry', 'P5 Citizen Verification', 'Land Assignment Workflow', 'Email OTP Service']
  });
};

app.get('/', healthResponse);
app.get('/api', healthResponse);

// Centralized Production Error Handling
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'সার্ভারে অভ্যন্তরীণ সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
    : err.message || 'Server Error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

const startServer = (dbStatus) => {
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀 e-Vhumi backend running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}`);
      console.log(`🗄️  Database: ${dbStatus}`);
      console.log(`📧 Email Service: ${process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com' ? 'Configured (' + process.env.EMAIL_USER + ')' : 'Simulated (Fallback Mode)'}`);
    });
  }
};

if (MONGO_URI && !MONGO_URI.includes('xxxxx')) {
  mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  })
    .then(() => {
      console.log('✅ MongoDB Atlas connected');
      startServer('MongoDB Atlas');
    })
    .catch(err => {
      console.warn('⚠️  MongoDB connection warning (Atlas IP whitelist required):', err.message);
      console.log('ℹ️  Resilient memory store fallback is active for OTP & user authentication.');
      startServer('Memory Fallback (Atlas IP Pending)');
    });
} else {
  console.log('⚠️  No MongoDB URI configured in environment. Starting with resilient in-memory storage.');
  startServer('In-Memory Mode');
}

module.exports = app;

