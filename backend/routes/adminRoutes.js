const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');
const LandAssignRequest = require('../models/LandAssignRequest');
const SystemLog = require('../models/SystemLog');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logActivity, seedInitialAuditLogs } = require('../utils/auditLogger');

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

    const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
    const cleanNid = toEnglishDigits((nid || '').toString().trim());
    if (![10, 13, 17].includes(cleanNid.length) || !/^\d+$/.test(cleanNid)) {
      return res.status(400).json({
        success: false,
        message: 'জাতীয় পরিচয়পত্র (NID) নম্বর অবশ্যই ১০, ১৩ অথবা ১৭ ডিজিটের হতে হবে (এর কম বা বেশি গ্রহণযোগ্য নয়)।'
      });
    }

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
      office_details: office_details || (role === 'Register Office' || role === 'AC Land Office' ? {
        office_name: `${upazila || district} ${role === 'Register Office' ? 'সাব-রেজিস্ট্রি অফিস' : 'সহকারী কমিশনার (ভূমি) অফিস'}`,
        designation: role === 'Register Office' ? 'সাব-রেজিস্ট্রার' : 'সহকারী কমিশনার (ভূমি)',
        circle: upazila || district
      } : undefined)
    });

    await newUser.save();
    const userObj = newUser.toObject();
    delete userObj.password;

    // Log Super Admin activity
    logActivity({
      req,
      action_type: 'ADMIN_USER_CREATED',
      module: 'User_Management',
      description: `সুপার এডমিন কর্তৃক নতুন ব্যবহারকারী তৈরি: ${newUser.name} (ভূমিকা: ${newUser.role})`,
      target_resource: `NID: ${newUser.nid}, Email: ${newUser.email}`,
      details: { role: newUser.role, division: newUser.division, district: newUser.district }
    });

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

    const previousRole = user.role;
    const previousStatus = user.status;

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

    // Determine specific action type
    let actionType = 'ADMIN_USER_UPDATED';
    let actionDesc = `সুপার এডমিন কর্তৃক ব্যবহারকারীর তথ্য হালনাগাদ: ${user.name}`;
    if (role && role !== previousRole) {
      actionType = 'ADMIN_ROLE_CHANGED';
      actionDesc = `সুপার এডমিন কর্তৃক ব্যবহারকারীর ভূমিকা পরিবর্তন: '${previousRole}' ➔ '${role}' (${user.name})`;
    } else if (status && status !== previousStatus) {
      actionType = 'ADMIN_USER_STATUS_TOGGLED';
      actionDesc = `সুপার এডমিন কর্তৃক ব্যবহারকারীর স্থিতি পরিবর্তন: '${previousStatus}' ➔ '${status}' (${user.name})`;
    }

    logActivity({
      req,
      action_type: actionType,
      module: 'User_Management',
      description: actionDesc,
      target_resource: `User ID: ${user._id}, NID: ${user.nid}`,
      details: { role: user.role, status: user.status, email: user.email, name: user.name }
    });

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

    if (user.email === 'admin@gmail.com' || user.email === 'admin@evhumi.gov.bd') {
      return res.status(400).json({ success: false, message: 'মূল মন্ত্রণালয় এডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না।' });
    }

    await User.findByIdAndDelete(id);

    logActivity({
      req,
      action_type: 'ADMIN_USER_DELETED',
      module: 'User_Management',
      description: `সুপার এডমিন কর্তৃক ব্যবহারকারী একাউন্ট মুছে ফেলা হয়েছে: ${user.name} (${user.email}, ${user.role})`,
      target_resource: `User ID: ${id}, NID: ${user.nid}`,
      details: { name: user.name, email: user.email, role: user.role }
    });

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

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক নতুন জমির রেকর্ড সংযোজন: মৌজা ${newLand.mouza}, দাগ ${newLand.dag_no}, খতিয়ান ${newLand.khatian_no}`,
      target_resource: `মৌজা: ${newLand.mouza}, দাগ: ${newLand.dag_no}, খতিয়ান: ${newLand.khatian_no}`,
      details: { area: newLand.total_area_decimal, owner: newLand.owner_name, nid: newLand.owner_nid }
    });

    return res.status(201).json({ success: true, message: 'নতুন জমির রেকর্ড সফলভাবে তৈরি হয়েছে!', data: newLand });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জমি সংরক্ষণ ব্যর্থ হয়েছে।', error: err.message });
  }
});

// PUT /api/admin/lands/:id - Edit Land Record
router.put('/lands/:id', async (req, res) => {
  try {
    const updated = await LandRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });

    logActivity({
      req,
      action_type: 'ADMIN_LAND_UPDATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক জমির রেকর্ড তথ্য সংশোধন: মৌজা ${updated?.mouza || ''}, দাগ ${updated?.dag_no || ''}, খতিয়ান ${updated?.khatian_no || ''}`,
      target_resource: `Land ID: ${req.params.id}`,
      details: req.body
    });

    return res.status(200).json({ success: true, message: 'জমির রেকর্ড আপডেট হয়েছে!', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'আপডেট ব্যর্থ হয়েছে।' });
  }
});

// DELETE /api/admin/lands/:id - Delete Land Record
router.delete('/lands/:id', async (req, res) => {
  try {
    const land = await LandRecord.findById(req.params.id);
    await LandRecord.findByIdAndDelete(req.params.id);

    logActivity({
      req,
      action_type: 'ADMIN_LAND_DELETED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক জমির রেকর্ড মুছে ফেলা হয়েছে: মৌজা ${land?.mouza || ''}, দাগ ${land?.dag_no || ''}`,
      target_resource: `Land ID: ${req.params.id}`
    });

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

    logActivity({
      req,
      action_type: 'LEGAL_CASE_ASSIGNED',
      module: 'Legal_Case',
      description: `সুপার এডমিন কর্তৃক জমির ওপর আইনি মামলা/নিষেধাজ্ঞা জারি: মৌজা ${cleanMouza}, দাগ ${cleanDag}, খতিয়ান ${cleanKhatian}`,
      target_resource: `মৌজা: ${cleanMouza}, দাগ: ${cleanDag}, খতিয়ান: ${cleanKhatian}`,
      details: { is_khas, khas_reason, has_court_case, case_details, stay_order }
    });

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
    const record = await LegalStatus.findById(req.params.id);
    await LegalStatus.findByIdAndDelete(req.params.id);

    logActivity({
      req,
      action_type: 'LEGAL_CASE_DELETED',
      module: 'Legal_Case',
      description: `সুপার এডমিন কর্তৃক জমির আইনি নোটিশ/মামলা প্রত্যাহার ও মুছে ফেলা হয়েছে: মৌজা ${record?.mouza || ''}, দাগ ${record?.dag_no || ''}, খতিয়ান ${record?.khatian_no || ''}`,
      target_resource: `Notice ID: ${req.params.id}`
    });

    return res.status(200).json({ success: true, message: 'আইনি নোটিশ মুছে ফেলা হয়েছে।' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. System Logs & Complete Audit Trail (Super Admin Only)
// ─────────────────────────────────────────────────────────────

// GET /api/admin/system-logs
router.get('/system-logs', async (req, res) => {
  try {
    // Seed initial historical logs if completely empty
    await seedInitialAuditLogs();

    const { role, module: mod, action_type, search, startDate, endDate, status, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Build Mongo query
    const query = {};
    if (role && role !== 'all') query.user_role = role;
    if (mod && mod !== 'all') query.module = mod;
    if (action_type && action_type !== 'all') query.action_type = action_type;
    if (status && status !== 'all') query.status = status;

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { user_name: { $regex: s, $options: 'i' } },
        { user_email: { $regex: s, $options: 'i' } },
        { user_nid: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { target_resource: { $regex: s, $options: 'i' } },
        { action_type: { $regex: s, $options: 'i' } }
      ];
    }

    let logs = [];
    let total = 0;

    try {
      total = await SystemLog.countDocuments(query);
      logs = await SystemLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    } catch (dbErr) {
      console.warn('SystemLog DB fetch fallback:', dbErr.message);
    }

    // Fallback to memory store if DB returned 0 or failed
    if (logs.length === 0 && global._memorySystemLogs && global._memorySystemLogs.length > 0) {
      let mem = [...global._memorySystemLogs];
      if (role && role !== 'all') mem = mem.filter(l => l.user_role === role);
      if (mod && mod !== 'all') mem = mem.filter(l => l.module === mod);
      if (action_type && action_type !== 'all') mem = mem.filter(l => l.action_type === action_type);
      if (status && status !== 'all') mem = mem.filter(l => l.status === status);
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        mem = mem.filter(l =>
          (l.user_name || '').toLowerCase().includes(s) ||
          (l.user_email || '').toLowerCase().includes(s) ||
          (l.user_nid || '').includes(s) ||
          (l.description || '').toLowerCase().includes(s) ||
          (l.target_resource || '').toLowerCase().includes(s)
        );
      }
      total = mem.length;
      logs = mem.slice(skip, skip + limitNum);
    }

    return res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      data: logs
    });
  } catch (err) {
    console.error('system-logs query error:', err);
    return res.status(500).json({ success: false, message: 'সিস্টেম লগ লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// GET /api/admin/system-logs/stats
router.get('/system-logs/stats', async (req, res) => {
  try {
    await seedInitialAuditLogs();

    let totalLogs = 0;
    let userLogs = 0;
    let registrarLogs = 0;
    let aclandLogs = 0;
    let adminLogs = 0;
    let last24hCount = 0;

    try {
      totalLogs = await SystemLog.countDocuments();
      userLogs = await SystemLog.countDocuments({ user_role: 'User' });
      registrarLogs = await SystemLog.countDocuments({ user_role: 'Register Office' });
      aclandLogs = await SystemLog.countDocuments({ user_role: 'AC Land Office' });
      adminLogs = await SystemLog.countDocuments({ user_role: 'Super Admin' });
      const since24h = new Date(Date.now() - 24 * 3600000);
      last24hCount = await SystemLog.countDocuments({ timestamp: { $gte: since24h } });
    } catch (dbErr) {
      const mem = global._memorySystemLogs || [];
      totalLogs = mem.length;
      userLogs = mem.filter(l => l.user_role === 'User').length;
      registrarLogs = mem.filter(l => l.user_role === 'Register Office').length;
      aclandLogs = mem.filter(l => l.user_role === 'AC Land Office').length;
      adminLogs = mem.filter(l => l.user_role === 'Super Admin').length;
      const since24h = Date.now() - 24 * 3600000;
      last24hCount = mem.filter(l => new Date(l.timestamp).getTime() >= since24h).length;
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalLogs,
        userLogs,
        registrarLogs,
        aclandLogs,
        adminLogs,
        last24hCount
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'লগ পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে।' });
  }
});

module.exports = router;
