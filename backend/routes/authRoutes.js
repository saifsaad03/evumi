const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, nid: user.nid },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Helper: generate token for virtual (env-based) super admin
const generateEnvAdminToken = () => {
  return jwt.sign(
    {
      id: 'env_super_admin',
      role: 'Super Admin',
      email: process.env.SUPER_ADMIN_EMAIL,
      nid: '0000000000000',
      name: process.env.SUPER_ADMIN_NAME || 'মন্ত্রণালয় প্রধান এডমিন'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
// Citizen registration with all required fields
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      father_name,
      mother_name,
      nid,
      division,
      district,
      upazila,
      phone,
      email,
      password
    } = req.body;

    // Validate required fields
    if (!name || !father_name || !mother_name || !nid || !division || !district || !upazila || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'সকল তথ্য প্রদান আবশ্যক: নাম, পিতার নাম, মাতার নাম, এনআইডি, বিভাগ, জেলা, উপজেলা, ফোন, ইমেইল এবং পাসওয়ার্ড।'
      });
    }

    // Block registration with the env super admin email
    if (email.trim().toLowerCase() === (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase()) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল ব্যবহার করা সম্ভব নয়।' });
    }

    const { findUserByEmail, findUserByNid, createCitizenUser } = require('../utils/dbStore');

    // Check if NID or Email already exists
    const existingNid = await findUserByNid(nid);
    if (existingNid) {
      return res.status(400).json({ success: false, message: 'এই জাতীয় পরিচয়পত্র (NID) ইতিমধ্যে নিবন্ধিত রয়েছে।' });
    }

    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল ঠিকানাটি ইতিমধ্যে ব্যবহৃত হচ্ছে।' });
    }

    // Create user with resilient store (MongoDB or memory fallback)
    const newUser = await createCitizenUser({
      name,
      father_name,
      mother_name,
      nid,
      division,
      district,
      upazila,
      phone,
      email,
      password
    });

    const token = generateToken(newUser);

    const userObj = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: '🎉 অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'নিবন্ধন ব্যর্থ হয়েছে।', error: err.message });
  }
});

// POST /api/auth/login
// Unified single login — checks env-based Super Admin first, then DB users
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'ইমেইল এবং পাসওয়ার্ড প্রদান করুন।' });
    }

    const emailLower = email.trim().toLowerCase();
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || '';

    // ---- Check env-configured Super Admin ----
    if (emailLower === superAdminEmail && superAdminEmail !== '') {
      if (password !== superAdminPassword) {
        return res.status(401).json({ success: false, message: 'ভুল ইমেইল বা পাসওয়ার্ড।' });
      }

      const token = generateEnvAdminToken();
      const adminUser = {
        _id: 'env_super_admin',
        name: process.env.SUPER_ADMIN_NAME || 'মন্ত্রণালয় প্রধান এডমিন',
        email: process.env.SUPER_ADMIN_EMAIL,
        role: 'Super Admin',
        status: 'Active',
        nid: '0000000000000',
        office_details: {
          office_name: 'ভূমি মন্ত্রণালয়, বাংলাদেশ সচিবালয়',
          designation: 'যুগ্ম সচিব (প্রশাসন)'
        }
      };

      return res.status(200).json({
        success: true,
        message: `স্বাগতম, ${adminUser.name}! লগইন সফল হয়েছে।`,
        token,
        user: adminUser
      });
    }

    // ---- Check DB / Resilient users (Register Office, AC Land, Citizen) ----
    const { findUserByEmail } = require('../utils/dbStore');
    const user = await findUserByEmail(emailLower);
    if (!user) {
      return res.status(401).json({ success: false, message: 'ভুল ইমেইল বা পাসওয়ার্ড।' });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({ success: false, message: 'আপনার অ্যাকাউন্টটি স্থগিত (Blocked) করা হয়েছে। কর্তৃপক্ষের সাথে যোগাযোগ করুন।' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'ভুল ইমেইল বা পাসওয়ার্ড।' });
    }

    const token = generateToken(user);
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: `স্বাগতম, ${user.name}! লগইন সফল হয়েছে।`,
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'লগইন ব্যর্থ হয়েছে।', error: err.message });
  }
});

// GET /api/auth/me
// Get current authenticated user
router.get('/me', verifyToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'সার্ভার ত্রুটি।' });
  }
});

module.exports = router;
