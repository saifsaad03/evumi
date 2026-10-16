const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const LandAssignRequest = require('../models/LandAssignRequest');
const { verifyToken } = require('../middleware/auth');

// GET /api/user/profile - Read only profile
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

// GET /api/user/assigned-lands
// Returns all lands assigned to the user that are approved by AC Land
router.get('/assigned-lands', verifyToken, async (req, res) => {
  try {
    const rawNid = req.user.nid || '';
    const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
    const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();
    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    const nidQuery = { $or: [{ owner_nid: rawNid }, { owner_nid: engNid }, { owner_nid: bngNid }] };
    const userNidQuery = { $or: [{ user_nid: rawNid }, { user_nid: engNid }, { user_nid: bngNid }] };

    // 1. Find all active land records currently owned by this citizen
    const activeLands = await LandRecord.find({
      ...nidQuery,
      status: 'Active'
    }).sort({ updatedAt: -1 });

    // 2. Find sold lands history for transparency
    const soldLands = await LandRecord.find({
      ...nidQuery,
      status: 'Sold'
    }).sort({ updatedAt: -1 });

    // 3. Find approved assignment history
    const approvedAssignments = await LandAssignRequest.find({
      ...userNidQuery,
      status: 'Approved'
    }).sort({ updatedAt: -1 });

    // 4. Find pending assignment requests for citizen awareness
    const pendingAssignments = await LandAssignRequest.find({
      ...userNidQuery,
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
