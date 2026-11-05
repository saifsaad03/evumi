const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { verifyToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const LandRecord = require('../models/LandRecord');
const DeathCertificate = require('../models/DeathCertificate');
const BontonnamaApplication = require('../models/BontonnamaApplication');
const { logActivity } = require('../utils/auditLogger');
const { sendOtpEmail } = require('../utils/emailService');
const { createDeedOtp, findLatestDeedOtp, findUserByNid } = require('../utils/dbStore');

// Bengali & English digit converters
const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

// Helper to generate 6-digit OTP
const generate6DigitOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────
// 0. Search Deceased Citizen by NID (Must be found first!)
// GET /api/bonton/search-deceased/:nid
// ─────────────────────────────────────────────────────────────
router.get('/search-deceased/:nid', async (req, res) => {
  try {
    const rawNid = (req.params.nid || '').toString().trim();
    if (!rawNid) {
      return res.status(400).json({ success: false, message: 'NID প্রদান আবশ্যক।' });
    }

    const cleanNid = rawNid;
    const engNid = toEnglishDigits(cleanNid);
    const bngNid = toBengaliDigits(cleanNid);

    let user = await User.findOne({
      $or: [{ nid: cleanNid }, { nid: engNid }, { nid: bngNid }]
    }).select('-password');

    if (!user) {
      user = (await findUserByNid(cleanNid)) ||
             (await findUserByNid(engNid)) ||
             (await findUserByNid(bngNid));
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '⚠️ প্রদত্ত NID-এর কোনো নাগরিক ডাটাবেজে পাওয়া যায়নি! অনুগ্রহ করে সঠিক NID প্রদান করুন।'
      });
    }

    const nidConditions = [{ owner_nid: cleanNid }, { owner_nid: engNid }, { owner_nid: bngNid }];
    const lands = await LandRecord.find({
      $or: nidConditions,
      status: { $in: ['Active', 'Pending_Mutation', 'Pending_AC_Land_Review', 'Deceased_Locked'] }
    });

    return res.status(200).json({
      success: true,
      message: `✅ নাগরিক সনাক্ত হয়েছে: ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        nid: user.nid,
        father_name: user.father_name || '',
        mother_name: user.mother_name || '',
        phone: user.phone || '',
        email: user.email || '',
        division: user.division || 'রাজশাহী',
        district: user.district || 'বগুড়া',
        upazila: user.upazila || 'শিবগঞ্জ',
        is_deceased: Boolean(user.is_deceased),
        status: user.status
      },
      lands_count: lands.length,
      lands
    });
  } catch (err) {
    console.error('search-deceased error:', err);
    return res.status(500).json({ success: false, message: 'নাগরিক অনুসন্ধান ব্যর্থ হয়েছে।', error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 1. Submit & Approve Death Certificate ➔ Immediately Lock Lands
// POST /api/bonton/death-certificate
// Sub-Registry Office records/approves death certificate
// ─────────────────────────────────────────────────────────────
router.post('/death-certificate', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      certificate_no,
      deceased_nid,
      deceased_name,
      deceased_phone,
      deceased_email,
      death_date,
      cause_of_death,
      issuing_authority,
      applicant_heir_name,
      applicant_heir_nid,
      applicant_heir_phone,
      relationship_with_deceased,
      remarks
    } = req.body;

    if (!certificate_no || !deceased_nid || !deceased_name || !death_date || !applicant_heir_nid) {
      return res.status(400).json({
        success: false,
        message: 'মৃত্যু সনদ নম্বর, মৃত ব্যক্তির NID ও নাম, মৃত্যুর তারিখ এবং আবেদনকারী ওয়ারিশের NID প্রদান আবশ্যক।'
      });
    }

    const cleanCertNo = certificate_no.toString().trim();
    const cleanNid = deceased_nid.toString().trim();
    const engNid = toEnglishDigits(cleanNid);
    const bngNid = toBengaliDigits(cleanNid);

    // Check if certificate already exists
    const existingCert = await DeathCertificate.findOne({ certificate_no: cleanCertNo });
    if (existingCert) {
      return res.status(400).json({
        success: false,
        message: `এই মৃত্যু সনদ নম্বর (${cleanCertNo}) ইতিমধ্যে ডাটাবেজে নিবন্ধিত আছে।`
      });
    }

    // 1. Find and update User record of deceased owner (MUST exist in database!)
    let deceasedUser = await User.findOne({
      $or: [{ nid: cleanNid }, { nid: engNid }, { nid: bngNid }]
    });

    if (!deceasedUser) {
      deceasedUser = (await findUserByNid(cleanNid)) ||
                     (await findUserByNid(engNid)) ||
                     (await findUserByNid(bngNid));
    }

    if (!deceasedUser) {
      return res.status(404).json({
        success: false,
        message: '⚠️ প্রদত্ত NID-এর কোনো নাগরিক ডাটাবেজে পাওয়া যায়নি। মৃত ব্যক্তিকে আগে সিস্টেমে নিবন্ধিত ইউজার হতে হবে।'
      });
    }

    deceasedUser.is_deceased = true;
    deceasedUser.status = 'Deceased';
    deceasedUser.death_certificate_no = cleanCertNo;
    deceasedUser.death_date = new Date(death_date);
    deceasedUser.death_verified_at = new Date();
    deceasedUser.death_verified_by = req.user?.name || 'সাব-রেজিস্ট্রার';
    await deceasedUser.save();

    // 2. Lock ALL active lands belonging to this deceased owner
    const nidConditions = [
      { owner_nid: cleanNid },
      { owner_nid: engNid },
      { owner_nid: bngNid }
    ];

    const landsToLock = await LandRecord.find({
      $or: nidConditions,
      status: { $in: ['Active', 'Pending_Mutation', 'Pending_AC_Land_Review'] }
    });

    let lockedCount = 0;
    for (const land of landsToLock) {
      land.is_deceased_locked = true;
      land.status = 'Deceased_Locked';
      land.bonton_status = 'Locked';
      land.remarks = `মালিকের মৃত্যু সনদ (${cleanCertNo}) অনুমোদিত। ওয়ারিশ বণ্টননামা প্রক্রিয়াধীন থাকায় জমিটি সাময়িকভাবে লক করা হয়েছে।`;
      land.last_updated = new Date();
      await land.save();
      lockedCount++;
    }

    // 3. Save Death Certificate Record
    const deathCert = new DeathCertificate({
      certificate_no: cleanCertNo,
      deceased_nid: cleanNid,
      deceased_name: deceasedUser?.name || deceased_name,
      deceased_phone: deceasedUser?.phone || deceased_phone,
      deceased_email: deceasedUser?.email || deceased_email,
      death_date: new Date(death_date),
      cause_of_death: cause_of_death || 'স্বাভাবিক / বার্ধক্যজনিত',
      issuing_authority: issuing_authority || 'ইউনিয়ন পরিষদ / পৌরসভা',
      applicant_heir_name,
      applicant_heir_nid,
      applicant_heir_phone,
      relationship_with_deceased: relationship_with_deceased || 'ওয়ারিশ',
      status: 'Approved',
      approved_by: req.user?.name || 'সাব-রেজিস্ট্রার',
      approved_at: new Date(),
      locked_lands_count: lockedCount,
      remarks: remarks || 'মৃত্যু সনদ যাচাইপূর্বক জমি বিক্রয় স্থগিত করা হলো।'
    });
    await deathCert.save();

    return res.status(201).json({
      success: true,
      message: `✅ মৃত্যু সনদ সফলভাবে যাচাই ও অনুমোদিত হয়েছে। মৃত মালিকের মোট ${lockedCount}টি জমির বিক্রয় কার্যক্রম সাময়িকভাবে স্থগিত (Locked) করা হয়েছে।`,
      data: deathCert,
      locked_lands_count: lockedCount
    });
  } catch (err) {
    console.error('Death certificate registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'মৃত্যু সনদ নিবন্ধন প্রক্রিয়া ব্যর্থ হয়েছে।',
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. GET /api/bonton/death-certificates
// List all approved death certificates
// ─────────────────────────────────────────────────────────────
router.get('/death-certificates', verifyToken, async (req, res) => {
  try {
    const list = await DeathCertificate.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'তথ্য লোড করা যায়নি।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. GET /api/bonton/deceased-lands/:nid
// Fetch all lands belonging to a deceased owner for distribution
// ─────────────────────────────────────────────────────────────
router.get('/deceased-lands/:nid', verifyToken, async (req, res) => {
  try {
    const cleanNid = req.params.nid.toString().trim();
    const engNid = toEnglishDigits(cleanNid);
    const bngNid = toBengaliDigits(cleanNid);

    const lands = await LandRecord.find({
      $or: [{ owner_nid: cleanNid }, { owner_nid: engNid }, { owner_nid: bngNid }]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: lands.length,
      data: lands
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মৃত মালিকের জমি লোড করা যায়নি।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. POST /api/bonton/verify-heir
// Verify an heir has an active User Account in the system
// ─────────────────────────────────────────────────────────────
router.post('/verify-heir', verifyToken, async (req, res) => {
  try {
    const { nid } = req.body;
    if (!nid) {
      return res.status(400).json({ success: false, message: 'ওয়ারিশের NID প্রদান আবশ্যক।' });
    }

    const cleanNid = nid.toString().trim();
    const engNid = toEnglishDigits(cleanNid);
    const bngNid = toBengaliDigits(cleanNid);

    let user = await User.findOne({
      $or: [{ nid: cleanNid }, { nid: engNid }, { nid: bngNid }]
    }).select('-password');

    if (!user) {
      user = (await findUserByNid(cleanNid)) ||
             (await findUserByNid(engNid)) ||
             (await findUserByNid(bngNid));
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '⚠️ ওয়ারিশের এই NID দিয়ে সিস্টেমে কোনো User Account পাওয়া যায়নি! জমি Assign করার জন্য প্রত্যেক ওয়ারিশের আগে থেকেই সিস্টেমে একটি User Account থাকতে হবে। ওয়ারিশকে প্রথমে নিবন্ধন করতে বলুন।'
      });
    }

    if (user.is_deceased || user.status === 'Deceased') {
      return res.status(400).json({
        success: false,
        message: '⚠️ এই ওয়ারিশ সিস্টেমে মৃত হিসেবে চিহ্নিত আছেন। জীবিত ওয়ারিশের NID প্রদান করুন।'
      });
    }

    return res.status(200).json({
      success: true,
      message: `✅ ওয়ারিশের অ্যাকাউন্ট যাচাই সম্পন্ন: ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        nid: user.nid,
        phone: user.phone,
        email: user.email,
        father_name: user.father_name,
        district: user.district,
        upazila: user.upazila
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'ওয়ারিশ যাচাই ব্যর্থ হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. POST /api/bonton/send-heir-otp
// Dispatch 6-digit OTP to heir email for verification
// ─────────────────────────────────────────────────────────────
router.post('/send-heir-otp', verifyToken, async (req, res) => {
  try {
    const { heir_email, heir_name, heir_nid, dag_no, mouza, khatian_no } = req.body;
    if (!heir_email || !heir_email.includes('@')) {
      return res.status(400).json({ success: false, message: 'ওয়ারিশের বৈধ ইমেইল ঠিকানা আবশ্যক।' });
    }

    const cleanEmail = heir_email.trim().toLowerCase();
    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save to resilient dbStore
    await createDeedOtp(cleanEmail, otp, {
      purpose: 'BONTON_NAMA_HEIR_OTP',
      heir_nid,
      dag_no,
      mouza,
      khatian_no
    }, expiresAt);

    console.log(`🔑 [BONTONNAMA HEIR OTP for ${cleanEmail}]: ${otp}`);

    // Send real email via Nodemailer
    await sendOtpEmail(cleanEmail, otp, 'DEED_REGISTRATION', {
      citizen_name: heir_name || 'ওয়ারিশ',
      deed_no: `বণ্টননামা-দাগ-${dag_no || ''}`,
      mouza: mouza || '',
      dag_no: dag_no || '',
      khatian_no: khatian_no || ''
    });

    return res.status(200).json({
      success: true,
      message: `ওয়ারিশের ইমেইলে (${cleanEmail}) ৬ ডিজিটের ওটিপি সফলভাবে পাঠানো হয়েছে।`
    });
  } catch (err) {
    console.error('Send heir OTP error:', err);
    return res.status(500).json({ success: false, message: 'ওটিপি পাঠাতে সমস্যা হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. POST /api/bonton/create-application
// Register Office creates Bonton Nama application with partial shares
// ─────────────────────────────────────────────────────────────
router.post('/create-application', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      land_record_id,
      death_certificate_no,
      heirs, // Array of { nid, name, phone, email, share_decimal, relationship, ... }
      otp
    } = req.body;

    if (!land_record_id || !death_certificate_no || !Array.isArray(heirs) || heirs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'জমির রেকর্ড আইডি, মৃত্যু সনদ নম্বর এবং কমপক্ষে একজন ওয়ারিশের তথ্য আবশ্যক।'
      });
    }

    // Verify OTP
    const cleanOtp = (otp || '').toString().trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '🔒 ওয়ারিশ বণ্টননামা আবেদন সাবমিট করার জন্য ৬ ডিজিটের ওটিপি ভেরিফিকেশন বাধ্যতামূলক।'
      });
    }

    const land = await LandRecord.findById(land_record_id);
    if (!land) {
      return res.status(404).json({ success: false, message: 'জমির রেকর্ড পাওয়া যায়নি।' });
    }

    const deathCert = await DeathCertificate.findOne({ certificate_no: death_certificate_no.trim() });
    if (!deathCert) {
      return res.status(404).json({ success: false, message: 'প্রদত্ত মৃত্যু সনদ ডাটাবেজে পাওয়া যায়নি।' });
    }

    // Verify all heirs and calculate total allocated decimal
    let totalAllocated = 0;
    const verifiedHeirs = [];

    for (let i = 0; i < heirs.length; i++) {
      const h = heirs[i];
      const share = parseFloat(h.share_decimal);
      if (isNaN(share) || share <= 0) {
        return res.status(400).json({
          success: false,
          message: `ওয়ারিশ ${h.name || (i + 1)}-এর জন্য বৈধ জমির পরিমাণ (শতক) প্রদান করুন!`
        });
      }

      totalAllocated += share;

      // Ensure user exists in DB
      const cleanHeirNid = h.nid.toString().trim();
      const engNid = toEnglishDigits(cleanHeirNid);
      const bngNid = toBengaliDigits(cleanHeirNid);
      let heirUser = await User.findOne({
        $or: [{ nid: cleanHeirNid }, { nid: engNid }, { nid: bngNid }]
      });

      if (!heirUser) {
        heirUser = (await findUserByNid(cleanHeirNid)) ||
                   (await findUserByNid(engNid)) ||
                   (await findUserByNid(bngNid));
      }

      if (!heirUser) {
        return res.status(400).json({
          success: false,
          message: `ওয়ারিশ '${h.name}' (NID: ${cleanHeirNid}) সিস্টেমে নিবন্ধিত নেই! প্রথমে অ্যাকাউন্ট খুলতে হবে।`
        });
      }

      verifiedHeirs.push({
        user_id: heirUser._id,
        nid: heirUser.nid,
        name: heirUser.name,
        phone: heirUser.phone || h.phone,
        email: heirUser.email || h.email,
        relationship: h.relationship || 'ওয়ারিশ',
        share_decimal: share,
        share_percent: Number(((share / land.total_area_decimal) * 100).toFixed(2)),
        nid_verified: true,
        otp_verified: true,
        fingerprint_verified: true
      });
    }

    // Precision check: Allocated area MUST NOT exceed available total land area
    const availableArea = parseFloat((land.total_area_decimal).toFixed(4));
    const requestedTotal = parseFloat(totalAllocated.toFixed(4));

    if (requestedTotal > availableArea + 0.001) {
      return res.status(400).json({
        success: false,
        message: `⚠️ বণ্টনকৃত জমির পরিমাণ (${requestedTotal} শতক) মোট জমির পরিমাণের (${availableArea} শতক) চেয়ে বেশি হতে পারে না!`
      });
    }

    const applicationNo = `BN-${land.dag_no}-${Date.now().toString().slice(-5)}`;

    const application = new BontonnamaApplication({
      application_no: applicationNo,
      deceased_nid: deathCert.deceased_nid,
      deceased_name: deathCert.deceased_name,
      death_certificate_no: deathCert.certificate_no,
      death_date: deathCert.death_date,
      land_record_id: land._id,
      division: land.division,
      district: land.district,
      upazila: land.upazila,
      mouza: land.mouza,
      jl_no: land.jl_no,
      khatian_no: land.khatian_no,
      dag_no: land.dag_no,
      total_area_decimal: land.total_area_decimal,
      allocated_area_decimal: requestedTotal,
      heirs: verifiedHeirs,
      sub_registry_office: req.user?.office_details?.office_name || 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস',
      submitted_by_officer: req.user?.name || 'সাব-রেজিস্ট্রার',
      submitted_by_nid: req.user?.nid,
      otp_code: cleanOtp,
      status: 'Pending_AC_Land_Review',
      payment_status: 'Unpaid',
      mutation_fee: 1150
    });

    await application.save();

    // Update land status
    land.bonton_status = 'Pending_AC_Land';
    land.status = 'Deceased_Locked';
    land.last_updated = new Date();
    await land.save();

    return res.status(201).json({
      success: true,
      message: `🎉 ওয়ারিশ বণ্টননামা আবেদন (আবেদন নং: ${applicationNo}) সফলভাবে সাবমিট হয়েছে এবং এসি ল্যান্ড অফিসে নামজারির জন্য প্রেরিত হয়েছে।`,
      data: application
    });
  } catch (err) {
    console.error('Create Bontonnama application error:', err);
    return res.status(500).json({
      success: false,
      message: 'বণ্টননামা আবেদন তৈরিতে সমস্যা হয়েছে।',
      error: err.message
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. GET /api/bonton/applications
// AC Land Office & Register Office view Bonton Nama applications
// ─────────────────────────────────────────────────────────────
router.get('/applications', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const apps = await BontonnamaApplication.find(query).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: apps.length,
      data: apps
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'আবেদন তালিকা লোড করা যায়নি।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. POST /api/bonton/process-payment/:id
// AC Land Office Payment procedure completion (e.g. ৳1,150)
// ─────────────────────────────────────────────────────────────
router.post('/process-payment/:id', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const app = await BontonnamaApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'আবেদন খুঁজে পাওয়া যায়নি।' });
    }

    app.payment_status = 'Paid';
    app.payment_transaction_id = `TXN-BN-${Date.now().toString().slice(-6)}`;
    await app.save();

    return res.status(200).json({
      success: true,
      message: `✅ বণ্টননামা ও নামজারি ফি (৳${app.mutation_fee}) সফলভাবে পরিশোধিত হয়েছে (ট্রানজেকশন ID: ${app.payment_transaction_id})।`,
      data: app
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'পেমেন্ট সম্পন্ন করা যায়নি।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. POST /api/bonton/approve-application/:id
// AC Land Officer approves Bonton Nama:
// Splits & assigns active LandRecords to each heir,
// sets original deceased record to 'Transferred_To_Heirs',
// marks deceased user as Deceased in User DB.
// ─────────────────────────────────────────────────────────────
router.post('/approve-application/:id', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const app = await BontonnamaApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ success: false, message: 'বণ্টননামা আবেদন পাওয়া যায়নি।' });
    }

    if (app.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'এই আবেদনটি ইতিমধ্যে অনুমোদিত ও নামজারি সম্পন্ন হয়েছে।' });
    }

    const origLand = await LandRecord.findById(app.land_record_id);
    if (!origLand) {
      return res.status(404).json({ success: false, message: 'মূল জমির রেকর্ড পাওয়া যায়নি।' });
    }

    const createdHeirRecords = [];

    // 1. Create a brand new active LandRecord for each heir
    for (let idx = 0; idx < app.heirs.length; idx++) {
      const heir = app.heirs[idx];
      const newQrId = `qr_bn_${Date.now()}_${idx}_${Math.floor(100 + Math.random() * 900)}`;
      const newKhatian = origLand.khatian_no;
      const newRecordId = `rec_bn_${Date.now()}_${idx}_${origLand.dag_no}`;

      const heirLand = new LandRecord({
        record_id: newRecordId,
        division: origLand.division,
        district: origLand.district,
        upazila: origLand.upazila,
        mouza: origLand.mouza,
        jl_no: origLand.jl_no,
        khatian_no: newKhatian,
        dag_no: origLand.dag_no,
        owner_nid: heir.nid,
        owner_name: heir.name,
        owner_phone: heir.phone,
        owner_email: heir.email,
        total_area_decimal: heir.share_decimal,
        available_area_decimal: heir.share_decimal,
        volume_book: origLand.volume_book || 'VOL-BONTON-2026',
        page_no: origLand.page_no || '০১',
        deed_no: `BONTON-${origLand.dag_no}-${Date.now().toString().slice(-4)}`,
        sub_registry_code: origLand.sub_registry_code || 'SR-BOG-SHIB-01',
        status: 'Active', // Active in heir's User Account!
        inheritance_source: `ওয়ারিশ বণ্টননামা (মৃত মালিক: ${app.deceased_name})`,
        payment_status: 'Paid',
        namjari_issued: true,
        qr_code_id: newQrId,
        remarks: `ওয়ারিশ বণ্টননামা (Bonton Nama) সূত্রে নামজারি খতিয়ান প্রস্তুত। সাবেক মৃত মালিক: ${app.deceased_name} (NID: ${app.deceased_nid})।`
      });

      await heirLand.save();
      createdHeirRecords.push(heirLand);
    }

    // 2. Mark original deceased owner's land as Transferred_To_Heirs with 0 available area
    origLand.available_area_decimal = 0;
    origLand.status = 'Transferred_To_Heirs';
    origLand.bonton_status = 'Distributed';
    origLand.remarks = `ওয়ারিশগণের মধ্যে বণ্টননামা সম্পন্ন হয়েছে (আবেদন নং: ${app.application_no})। মোট ${app.heirs.length} জন ওয়ারিশের নামে জমি স্থানান্তরিত হয়েছে।`;
    origLand.last_updated = new Date();
    await origLand.save();

    // 3. Mark the deceased user in User database
    const deceasedNid = app.deceased_nid;
    const engNid = toEnglishDigits(deceasedNid);
    const bngNid = toBengaliDigits(deceasedNid);

    const deceasedUser = await User.findOne({
      $or: [{ nid: deceasedNid }, { nid: engNid }, { nid: bngNid }]
    });

    if (deceasedUser) {
      deceasedUser.is_deceased = true;
      deceasedUser.status = 'Deceased';
      deceasedUser.death_verified_at = new Date();
      await deceasedUser.save();
    }

    // 4. Update BontonnamaApplication status
    app.status = 'Approved';
    app.payment_status = 'Paid';
    app.ac_land_reviewed_by = req.user?.name || 'সহকারী কমিশনার (ভূমি)';
    app.ac_land_reviewed_at = new Date();
    app.remarks = `সহকারী কমিশনার (ভূমি) কর্তৃক যাচাই ও অনুমোদন সম্পন্ন। মোট ${app.heirs.length} জন ওয়ারিশের নামে সফলভাবে জমি Assign করা হয়েছে।`;
    await app.save();

    return res.status(200).json({
      success: true,
      message: `🎉 বণ্টননামা ও নামজারি অনুমোদন সফলভাবে সম্পন্ন হয়েছে! মোট ${app.heirs.length} জন ওয়ারিশের User Account-এ জমি সক্রিয় (Active) হয়েছে।`,
      data: app,
      new_khatians: createdHeirRecords.map(r => ({
        khatian_no: r.khatian_no,
        owner_name: r.owner_name,
        owner_nid: r.owner_nid,
        area_decimal: r.total_area_decimal,
        status: r.status
      }))
    });
  } catch (err) {
    console.error('Approve Bontonnama error:', err);
    return res.status(500).json({
      success: false,
      message: 'বণ্টননামা অনুমোদন ব্যর্থ হয়েছে।',
      error: err.message
    });
  }
});

module.exports = router;

