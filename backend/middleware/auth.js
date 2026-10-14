const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { findUserByEmail } = require('../utils/dbStore');

const JWT_SECRET = process.env.JWT_SECRET || 'evhumi_super_secure_jwt_secret_key_2026_ministry_of_land';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'অননুমোদিত প্রবেশাধিকার। টোকেন পাওয়া যায়নি।' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // 1. Virtual / Environment Super Admin bypass
    if (decoded.id === 'env_super_admin' || decoded.role === 'Super Admin') {
      req.user = {
        _id: 'env_super_admin',
        name: decoded.name || process.env.SUPER_ADMIN_NAME || 'মন্ত্রণালয় প্রধান এডমিন',
        email: decoded.email || process.env.SUPER_ADMIN_EMAIL,
        role: 'Super Admin',
        status: 'Active',
        nid: '0000000000000',
        office_details: {
          office_name: 'ভূমি মন্ত্রণালয়, বাংলাদেশ সচিবালয়',
          designation: 'যুগ্ম সচিব (প্রশাসন)'
        }
      };
      return next();
    }

    // 2. Look up user by email from resilient store (supports Atlas + memory fallback)
    let user = null;
    try {
      if (decoded.email) {
        user = await findUserByEmail(decoded.email);
      }

      // 3. Fallback to direct DB findById if valid ObjectId
      if (!user && decoded.id && mongoose.Types.ObjectId.isValid(decoded.id)) {
        user = await User.findById(decoded.id).select('-password');
      }
    } catch (dbErr) {
      console.warn('⚠️ DB lookup failed in auth middleware, using JWT payload:', dbErr.message);
    }

    // 4. If user found in DB/memory, use that
    if (user) {
      if (user.status === 'Blocked') {
        return res.status(403).json({ success: false, message: 'আপনার অ্যাকাউন্টটি স্থগিত (Blocked) করা হয়েছে।' });
      }
      req.user = user.toObject ? user.toObject() : { ...user };
      delete req.user.password;
      return next();
    }

    // 5. DB unavailable — fallback to JWT token payload so reload works
    // This handles the case where Atlas IP is not whitelisted or DB is temporarily down
    if (decoded.id && decoded.role && decoded.email) {
      req.user = {
        _id: decoded.id,
        id: decoded.id,
        name: decoded.name || decoded.email,
        email: decoded.email,
        nid: decoded.nid || '',
        role: decoded.role,
        status: 'Active'
      };
      return next();
    }

    return res.status(401).json({ success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'টোকেন মেয়াদোত্তীর্ণ বা অবৈধ।' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'প্রথমে লগইন করুন।' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `প্রবেশাধিকার নেই। এই ফিচারের জন্য অনুমোদিত রোল: ${allowedRoles.join(', ')}। আপনার বর্তমান রোল: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = { verifyToken, requireRole, JWT_SECRET };
