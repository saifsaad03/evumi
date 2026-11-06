const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LandRecord = require('../models/LandRecord');
const LandAssignRequest = require('../models/LandAssignRequest');
const { verifyToken } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLogger');

// GET /api/user/profile - Read user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'প্রোফাইল লোড করা সম্ভব হয়নি।' });
  }
});

// PUT /api/user/profile - User updates their own profile/account info
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }

    const changedFields = [];
    const prevDetails = { phone: user.phone, email: user.email };

    if (phone && phone !== user.phone) {
      const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
      const cleanPhone = toEnglishDigits(phone.toString().trim());
      if (cleanPhone.length !== 11 || !/^\d{11}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'মোবাইল নম্বর অবশ্যই ১১ ডিজিটের হতে হবে (এর কম বা বেশি গ্রহণযোগ্য নয়)।'
        });
      }
      changedFields.push(`মোবাইল নম্বর (${user.phone} ➔ ${cleanPhone})`);
      user.phone = cleanPhone;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'এই ইমেইলটি অন্য একাউন্টে ব্যবহৃত হচ্ছে।' });
      }
      changedFields.push(`ইমেইল ঠিকানা (${user.email} ➔ ${email})`);
      user.email = email;
    }

    if (password && password.trim()) {
      user.password = password; // pre-save hook will hash
      changedFields.push('অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন');
    }

    if (changedFields.length === 0) {
      return res.status(200).json({ success: true, message: 'কোনো পরিবর্তন করা হয়নি।' });
    }

    await user.save();

    // Log User profile activity
    logActivity({
      req,
      action_type: 'USER_PROFILE_UPDATE',
      module: 'Profile',
      description: `নাগরিক ${user.name} তার প্রোফাইল পরিবর্তন করেছেন: ${changedFields.join(', ')}`,
      target_resource: `User: ${user.name} (NID: ${user.nid})`,
      details: {
        changedFields,
        previous: prevDetails,
        updated: { phone: user.phone, email: user.email }
      }
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: '✅ প্রোফাইল সফলভাবে আপডেট করা হয়েছে!',
      user: userObj
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।' });
  }
});

// GET /api/user/assigned-lands
// Returns only the lands assigned to and owned by this specific citizen
router.get('/assigned-lands', verifyToken, async (req, res) => {
  try {
    const rawNid = (req.user?.nid || '').toString().trim();
    if (!rawNid) {
      return res.status(200).json({
        success: true,
        data: {
          active_lands: [],
          sold_lands: [],
          approved_assignments: [],
          pending_assignments: []
        }
      });
    }

    const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
    const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();
    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    const nidConditions = [
      { owner_nid: rawNid },
      { owner_nid: engNid },
      { owner_nid: bngNid },
      { 'co_owners.nid': rawNid },
      { 'co_owners.nid': engNid },
      { 'co_owners.nid': bngNid },
      { 'buyers.nid': rawNid },
      { 'buyers.nid': engNid },
      { 'buyers.nid': bngNid },
      { 'bayna_details.bayna_buyer_nid': rawNid },
      { 'bayna_details.bayna_buyer_nid': engNid },
      { 'bayna_details.bayna_buyer_nid': bngNid },
      { 'mortgage_details.mortgagee_nid': rawNid },
      { 'mortgage_details.mortgagee_nid': engNid },
      { 'mortgage_details.mortgagee_nid': bngNid }
    ];

    const userNidConditions = [
      { user_nid: rawNid },
      { user_nid: engNid },
      { user_nid: bngNid }
    ];

    // 1. Strictly find ONLY land records owned by THIS citizen (Active, Deceased_Locked, Mortgage_Locked, Bayna_Locked)
    // Never include government khas or unassigned plots
    const activeLands = await LandRecord.find({
      $and: [
        { $or: nidConditions },
        { owner_nid: { $nin: ['GOVT-KHAS-01', '1000000000000', 'অনলাইনে রেকর্ড নেই', ''] } },
        { owner_name: { $not: /সরকার|অনলাইনে অনিবন্ধিত/ } },
        { status: { $in: ['Active', 'Deceased_Locked', 'Mortgage_Locked', 'Bayna_Locked'] } }
      ]
    }).sort({ updatedAt: -1 });

    // 2. Find sold lands history for THIS citizen
    const soldLands = await LandRecord.find({
      $and: [
        { $or: nidConditions },
        { owner_nid: { $nin: ['GOVT-KHAS-01', '1000000000000', 'অনলাইনে রেকর্ড নেই', ''] } },
        { status: 'Sold' }
      ]
    }).sort({ updatedAt: -1 });

    // 3. Find approved assignment history for THIS citizen
    const approvedAssignments = await LandAssignRequest.find({
      $or: userNidConditions,
      status: 'Approved'
    }).sort({ updatedAt: -1 });

    // 4. Find pending assignment requests for THIS citizen
    const pendingAssignments = await LandAssignRequest.find({
      $or: userNidConditions,
      status: 'Pending_AC_Land_Review'
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        active_lands: activeLands,
        sold_lands: soldLands,
        approved_assignments: approvedAssignments,
        pending_assignments: pendingAssignments
      }
    });
  } catch (err) {
    console.error('Error fetching assigned lands:', err);
    return res.status(500).json({ success: false, message: 'জমির তালিকা লোড করতে ব্যর্থ হয়েছে।' });
  }
});

module.exports = router;
