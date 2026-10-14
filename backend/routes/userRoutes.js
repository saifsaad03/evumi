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
    const userNid = req.user.nid;

    // 1. Find all active land records currently owned by this citizen
    const activeLands = await LandRecord.find({
      owner_nid: userNid,
      status: 'Active'
    }).sort({ updatedAt: -1 });

    // 2. Find approved assignment history
    const approvedAssignments = await LandAssignRequest.find({
      user_nid: userNid,
      status: 'Approved'
    }).sort({ updatedAt: -1 });

    // 3. Find pending assignment requests for citizen awareness
    const pendingAssignments = await LandAssignRequest.find({
      user_nid: userNid,
      status: 'Pending_AC_Land_Review'
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        active_lands: activeLands,
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
