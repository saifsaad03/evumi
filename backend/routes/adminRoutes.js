const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');
const LandAssignRequest = require('../models/LandAssignRequest');
const { verifyToken, requireRole } = require('../middleware/auth');

const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

// Protect all admin routes for Super Admin
router.use(verifyToken, requireRole('Super Admin'));

// 1. GET /api/admin/stats - System high-level statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    const totalLands = await LandRecord.countDocuments();
    const activeLands = await LandRecord.countDocuments({ status: 'Active' });
    const pendingMutations = await LandRecord.countDocuments({ status: 'Pending_Mutation' });
    const pendingAssignments = await LandAssignRequest.countDocuments({ status: 'Pending_AC_Land_Review' });
    const approvedAssignments = await LandAssignRequest.countDocuments({ status: 'Approved' });
    const totalLegalIssues = await LegalStatus.countDocuments();

    // Aggregate fraud alerts across land records
    const fraudLands = await LandRecord.find({ 'fraud_alerts.0': { $exists: true } });
    const totalFraudAttempts = fraudLands.reduce((acc, l) => acc + (l.fraud_alerts ? l.fraud_alerts.length : 0), 0);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        usersByRole,
        totalLands,
        activeLands,
        pendingMutations,
        pendingAssignments,
        approvedAssignments,
        totalLegalIssues,
        totalFraudAttempts
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// 2. User CRUD
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { role, search, status } = req.query;
    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nid: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'ইউজার লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// POST /api/admin/users - Create new user or official
router.post('/users', async (req, res) => {
  try {
    const {
      name, father_name, mother_name, nid, division, district,
      upazila, phone, email, password, role, office_details
    } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হচ্ছে।' });
    }

    const existingNid = await User.findOne({ nid });
    if (existingNid) {
      return res.status(400).json({ success: false, message: 'এই এনআইডি ইতিমধ্যে নিবন্ধিত।' });
    }

    const newUser = new User({
      name,
      father_name: father_name || 'পিতা',
      mother_name: mother_name || 'মাতা',
      nid,
      division: division || 'ঢাকা',
      district: district || 'ঢাকা',
      upazila: upazila || 'সদর',
      phone,
      email,
      password: password || '123456',
      role: role || 'User',
      office_details
    });

    await newUser.save();
    const userObj = newUser.toObject();
    delete userObj.password;

    return res.status(201).json({ success: true, message: 'ব্যবহারকারী সফলভাবে যুক্ত হয়েছে!', data: userObj });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

// PUT /api/admin/users/:id - Update user, change role, or toggle status
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, father_name, mother_name, phone, email, role, status, office_details } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }

    if (name) user.name = name;
    if (father_name) user.father_name = father_name;
    if (mother_name) user.mother_name = mother_name;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (role) user.role = role; // Ministry admin can change role
    if (status) user.status = status; // Active / Blocked
    if (office_details) user.office_details = office_details;

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: `✅ ব্যবহারকারীর তথ্য ও ভূমিকা (${user.role}) সফলভাবে আপডেট হয়েছে!`,
      data: userObj
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'আপডেট ব্যর্থ হয়েছে।', error: err.message });
  }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি।' });
    }

    if (user.email === 'admin@gmail.com') {
      return res.status(400).json({ success: false, message: 'মূল মন্ত্রণালয় এডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না।' });
    }

    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'ব্যবহারকারী সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// 3. Land Data CRUD
// GET /api/admin/lands
router.get('/lands', async (req, res) => {
  try {
    const { search, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { dag_no: search },
        { khatian_no: search },
        { mouza: { $regex: search, $options: 'i' } },
        { owner_name: { $regex: search, $options: 'i' } },
        { owner_nid: { $regex: search, $options: 'i' } }
      ];
    }
    const lands = await LandRecord.find(query).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, count: lands.length, data: lands });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জমির তথ্য লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/admin/lands - Add new Land Record
router.post('/lands', async (req, res) => {
  try {
    const landData = req.body;
    if (!landData.record_id) {
      landData.record_id = 'record_' + Date.now();
    }
    const newLand = new LandRecord(landData);
    await newLand.save();
    return res.status(201).json({ success: true, message: 'নতুন জমির রেকর্ড সফলভাবে তৈরি হয়েছে!', data: newLand });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জমি সংরক্ষণ ব্যর্থ হয়েছে।', error: err.message });
  }
});

// PUT /api/admin/lands/:id - Edit Land Record
router.put('/lands/:id', async (req, res) => {
  try {
    const updated = await LandRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, message: 'জমির রেকর্ড আপডেট হয়েছে!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'আপডেট ব্যর্থ হয়েছে।' });
  }
});

// DELETE /api/admin/lands/:id - Delete Land Record
router.delete('/lands/:id', async (req, res) => {
  try {
    await LandRecord.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'জমির রেকর্ড মুছে ফেলা হয়েছে।' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// 4. Legal Status CRUD
// GET /api/admin/legal-statuses
router.get('/legal-statuses', async (req, res) => {
  try {
    const statuses = await LegalStatus.find({}).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: statuses });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'আইনি স্ট্যাটাস লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/admin/legal-statuses
// Standard Case Identification Parameters: Mouza + Dag Number + Khatian Number
router.post('/legal-statuses', async (req, res) => {
  try {
    const { dag_no, mouza, khatian_no, jl_no, is_khas, khas_reason, has_court_case, case_details, stay_order } = req.body;

    const cleanDag = (dag_no || '').toString().trim();
    const cleanMouza = (mouza || '').toString().trim();
    const cleanKhatian = (khatian_no || '').toString().trim();

    if (!cleanDag || !cleanMouza || !cleanKhatian) {
      return res.status(400).json({
        success: false,
        message: 'জমির ওপর মামলা বা আইনি নোটিশ যুক্ত করার জন্য মৌজা, দাগ নম্বর এবং খতিয়ান নম্বর — ৩টি ফিল্ডই আবশ্যক।'
      });
    }

    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);
    const engKhatian = toEnglishDigits(cleanKhatian);
    const bngKhatian = toBengaliDigits(cleanKhatian);

    // Case identification parameter: Mouza + Dag + Khatian
    let record = await LegalStatus.findOne({
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $and: [
        { $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }] },
        { $or: [{ khatian_no: cleanKhatian }, { khatian_no: engKhatian }, { khatian_no: bngKhatian }] }
      ]
    });

    if (record) {
      record.khatian_no = cleanKhatian;
      record.is_khas = is_khas;
      record.khas_reason = khas_reason;
      record.has_court_case = has_court_case;
      record.case_details = case_details;
      record.stay_order = stay_order;
      await record.save();
    } else {
      record = new LegalStatus({
        dag_no: cleanDag,
        mouza: cleanMouza,
        khatian_no: cleanKhatian,
        jl_no: jl_no || '54',
        is_khas,
        khas_reason,
        has_court_case,
        case_details,
        stay_order
      });
      await record.save();
    }
    return res.status(200).json({
      success: true,
      message: `✅ আইনি স্ট্যাটাস সফলভাবে সংরক্ষিত হয়েছে (মৌজা: ${cleanMouza}, দাগ: ${cleanDag}, খতিয়ান: ${cleanKhatian})!`,
      data: record
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'আইনি স্ট্যাটাস সংরক্ষণ ব্যর্থ হয়েছে।' });
  }
});

// DELETE /api/admin/legal-statuses/:id
router.delete('/legal-statuses/:id', async (req, res) => {
  try {
    await LegalStatus.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'আইনি নোটিশ মুছে ফেলা হয়েছে।' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

module.exports = router;
