const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const User = require('../models/User');
const LandAssignRequest = require('../models/LandAssignRequest');
const OtpVerification = require('../models/OtpVerification');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/assign/filter-options
// Provides distinct cascade dropdown options
router.get('/filter-options', verifyToken, async (req, res) => {
  try {
    const { division, district, upazila, mouza } = req.query;

    const query = {};
    if (division) query.division = division;
    if (district) query.district = district;
    if (upazila) query.upazila = upazila;
    if (mouza) query.mouza = mouza;

    const lands = await LandRecord.find(query);

    const divisions = [...new Set(lands.map(l => l.division || 'ঢাকা'))];
    const districts = [...new Set(lands.map(l => l.district || 'ঢাকা'))];
    const upazilas = [...new Set(lands.map(l => l.upazila || 'ধানমন্ডি'))];
    const mouzas = [...new Set(lands.map(l => l.mouza))];
    const jl_nos = [...new Set(lands.map(l => l.jl_no))];
    const khatian_nos = [...new Set(lands.map(l => l.khatian_no))];
    const dag_nos = [...new Set(lands.map(l => l.dag_no))];

    return res.status(200).json({
      success: true,
      options: {
        divisions,
        districts,
        upazilas,
        mouzas,
        jl_nos,
        khatian_nos,
        dag_nos
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'ফিল্টার অপশন লোড করা যায়নি।' });
  }
});

// GET /api/assign/search-land
// Register Office searches land by cascade parameters.
// LOGIC: Any Dag and any criteria dynamically exists as available government khas land.
// BUT once a land is assigned or in-process, it is locked and CANNOT be assigned to anyone else!
router.get('/search-land', verifyToken, async (req, res) => {
  try {
    const { division, district, upazila, mouza, jl_no, khatian_no, dag_no } = req.query;

    const cleanDag = (dag_no || '101').toString().trim();
    const cleanMouza = (mouza || 'গুজিয়া').toString().trim();
    const cleanKhatian = (khatian_no || '১').toString().trim();
    const cleanJl = (jl_no || '1').toString().trim();

    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);

    // 1. Search if this plot already exists in MongoDB
    let record = await LandRecord.findOne({
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    });

    // If an existing record had legacy gov owner name/nid, sanitize it to unassigned
    if (record) {
      let changed = false;
      if (record.owner_nid === '1000000000000' || record.owner_name?.includes('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার')) {
        record.owner_name = 'অনলাইনে অনিবন্ধিত';
        record.owner_nid = 'অনলাইনে রেকর্ড নেই';
        changed = true;
      }
      if (record.total_area_decimal === 20 && (record.owner_name === 'অনলাইনে অনিবন্ধিত' || !record.owner_nid || record.owner_nid === 'অনলাইনে রেকর্ড নেই')) {
        const numPart = parseInt(engDag.replace(/\D/g, ''), 10) || (Math.floor(Math.random() * 30) + 1);
        const variedArea = Number(((numPart * 7.3) % 36 + 8.5).toFixed(1));
        record.total_area_decimal = variedArea;
        record.available_area_decimal = variedArea;
        changed = true;
      }
      if (changed) {
        await record.save();
      }
    }

    // 2. If it does NOT exist yet, dynamically initialize it as unassigned real-life plot!
    if (!record) {
      // Calculate a varied, realistic area between 8.5 and 45.0 decimals based on dag number
      const numPart = parseInt(engDag.replace(/\D/g, ''), 10) || (Math.floor(Math.random() * 30) + 1);
      const variedArea = Number(((numPart * 7.3) % 36 + 8.5).toFixed(1));

      record = new LandRecord({
        record_id: `rec_${Date.now()}_${engDag}`,
        division: division || 'রাজশাহী',
        district: district || 'বগুড়া',
        upazila: upazila || 'শিবগঞ্জ',
        mouza: cleanMouza,
        jl_no: cleanJl,
        khatian_no: cleanKhatian || '১',
        dag_no: cleanDag,
        owner_nid: 'অনলাইনে রেকর্ড নেই',
        owner_name: 'অনলাইনে অনিবন্ধিত',
        owner_phone: 'N/A',
        owner_email: '',
        total_area_decimal: variedArea,
        available_area_decimal: variedArea,
        volume_book: 'VOL-KHAS-2026',
        page_no: '০১',
        deed_no: `GOV-${engDag}-${Date.now().toString().slice(-4)}`,
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: 'Active'
      });
      await record.save();
    }

    return res.status(200).json({
      success: true,
      count: 1,
      data: [record]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জমি খোঁজা ব্যর্থ হয়েছে।' });
  }
});

const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

// GET /api/assign/search-user
// Register Office finds citizen by NID, phone, or email
router.get('/search-user', verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'অনুসন্ধানের জন্য NID, ফোন বা ইমেইল দিন।' });
    }

    const rawQuery = query.toString().trim();
    const engQuery = toEnglishDigits(rawQuery);
    const bngQuery = toBengaliDigits(rawQuery);

    const user = await User.findOne({
      $or: [
        { nid: rawQuery },
        { nid: engQuery },
        { nid: bngQuery },
        { phone: rawQuery },
        { phone: engQuery },
        { phone: bngQuery },
        { email: rawQuery.toLowerCase() }
      ]
    }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'প্রদত্ত তথ্য অনুযায়ী কোনো নিবন্ধিত নাগরিক পাওয়া যায়নি।' });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'নাগরিক অনুসন্ধান ব্যর্থ হয়েছে।' });
  }
});

// POST /api/assign/create-request
// Register Office assigns land to user -> sends to AC Land with status Pending_AC_Land_Review
// REQUIRES Citizen Email OTP verification
router.post('/create-request', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      land_record_id,
      user_nid,
      volume_book,
      page_no,
      deed_no,
      remarks,
      otp
    } = req.body;

    if (!land_record_id || !user_nid || !volume_book || !page_no) {
      return res.status(400).json({
        success: false,
        message: 'জমি, নাগরিকের NID, ভলিউম বই নম্বর এবং পৃষ্ঠা নম্বর প্রদান আবশ্যক।'
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: '🔒 নাগরিকের ইমেইল ওটিপি (OTP) কোড প্রদান আবশ্যক। অনুগ্রহ করে প্রথমে ওটিপি পাঠান।'
      });
    }

    // Verify land record
    const land = await LandRecord.findById(land_record_id);
    if (!land) {
      return res.status(404).json({ success: false, message: 'জমির রেকর্ড পাওয়া যায়নি।' });
    }

    // Check if land is already pending review or sold
    if (land.status === 'Pending_AC_Land_Review' || land.status === 'Pending_Mutation' || land.status === 'Sold') {
      return res.status(400).json({
        success: false,
        message: `এই জমিটি বর্তমানে '${land.status}' অবস্থায় রয়েছে। নতুন অ্যাসাইনমেন্ট করা সম্ভব নয়।`
      });
    }

    // Verify citizen with English/Bengali digits
    const rawNid = user_nid.toString().trim();
    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    // If land is already owned by another citizen (not unassigned / khas)
    const isUnassigned = !land.owner_nid || land.owner_nid === '1000000000000' || land.owner_nid === 'অনলাইনে রেকর্ড নেই' || land.owner_name === 'অনলাইনে অনিবন্ধিত' || (land.owner_name && land.owner_name.includes('সরকার'));
    if (!isUnassigned && land.owner_nid !== rawNid && land.owner_nid !== engNid && land.owner_nid !== bngNid) {
      return res.status(400).json({
        success: false,
        message: `এই জমিটি ইতিমধ্যে '${land.owner_name}' (NID: ${land.owner_nid})-এর নামে রেকর্ডভুক্ত রয়েছে। অন্য কাউকে পুনরায় বরাদ্দ দেওয়া যাবে না!`
      });
    }

    const citizen = await User.findOne({
      $or: [
        { nid: rawNid },
        { nid: engNid },
        { nid: bngNid }
      ]
    });

    if (!citizen) {
      return res.status(404).json({ success: false, message: 'প্রদত্ত এনআইডিধারী নাগরিক নিবন্ধিত নয়।' });
    }

    // Verify citizen's email OTP
    const cleanOtp = otp.toString().trim();
    const otpRecord = await OtpVerification.findOne({
      $or: [
        { email: citizen.email.toLowerCase(), purpose: 'LAND_ASSIGNMENT' },
        { 'metadata.citizen_nid': citizen.nid, purpose: 'LAND_ASSIGNMENT' }
      ]
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'নাগরিকের ইমেইলে কোনো সক্রিয় ওটিপি রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে প্রথমে "ওটিপি পাঠান" এ ক্লিক করুন।'
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'ওটিপির মেয়াদ শেষ হয়ে গেছে। নাগরিকের ইমেইলে পুনরায় নতুন ওটিপি পাঠান।'
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'ভুল ওটিপি চেষ্টার সীমা অতিক্রম করেছে। পুনরায় ওটিপি কোড পাঠান।'
      });
    }

    if (otpRecord.otp !== cleanOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: `ভুল ওটিপি কোড! নাগরিকের ইমেইল (${citizen.email}) এ প্রেরিত কোডটি দিন। (বাকি চেষ্টা: ${5 - otpRecord.attempts})`
      });
    }

    // Mark OTP as verified and clean up
    otpRecord.verified = true;
    await otpRecord.save();
    await OtpVerification.deleteMany({ email: citizen.email.toLowerCase(), purpose: 'LAND_ASSIGNMENT' });

    const requestId = 'REQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

    const newRequest = new LandAssignRequest({
      request_id: requestId,
      land_record_id: land._id,
      division: land.division || 'ঢাকা',
      district: land.district || 'ঢাকা',
      upazila: land.upazila || 'ধানমন্ডি',
      mouza: land.mouza,
      jl_no: land.jl_no,
      khatian_no: land.khatian_no,
      dag_no: land.dag_no,
      area_decimal: land.available_area_decimal || land.total_area_decimal,
      volume_book: volume_book.trim(),
      page_no: page_no.trim(),
      deed_no: deed_no ? deed_no.trim() : `DEED-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: citizen._id,
      user_nid: citizen.nid,
      user_name: citizen.name,
      user_phone: citizen.phone,
      user_email: citizen.email,
      submitted_by_officer: req.user.name,
      submitted_by_id: req.user._id,
      sub_registry_office: req.user.office_details?.office_name || 'সদর সাব-রেজিস্ট্রি অফিস',
      status: 'Pending_AC_Land_Review',
      remarks
    });

    await newRequest.save();

    // Mark land as Pending_AC_Land_Review
    land.status = 'Pending_AC_Land_Review';
    land.volume_book = volume_book;
    land.page_no = page_no;
    if (deed_no) land.deed_no = deed_no;
    await land.save();

    return res.status(201).json({
      success: true,
      message: '✅ জমিটি নাগরিককে বরাদ্দ (Assign) করার অনুরোধ সফলভাবে এসি ল্যান্ড (AC Land) অফিসে পাঠানো হয়েছে!',
      data: newRequest
    });
  } catch (err) {
    console.error('Assign create error:', err);
    return res.status(500).json({ success: false, message: 'অনুরোধ তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

// GET /api/assign/requests
// AC Land and Register Office view requests
router.get('/requests', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const requests = await LandAssignRequest.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'অনুরোধ তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/assign/review-request/:id
// AC Land reviews and approves or rejects assignment
router.post('/review-request/:id', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejection_reason, remarks } = req.body;

    const request = await LandAssignRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'অনুরোধ পাওয়া যায়নি।' });
    }

    if (request.status !== 'Pending_AC_Land_Review') {
      return res.status(400).json({ success: false, message: `এই অনুরোধটি ইতিমধ্যে '${request.status}' অবস্থায় রয়েছে।` });
    }

    const land = await LandRecord.findById(request.land_record_id);

    if (action === 'Approve') {
      request.status = 'Approved';
      request.ac_land_reviewed_by = req.user.name;
      request.ac_land_reviewed_at = new Date();
      if (remarks) request.remarks = remarks;
      await request.save();

      // Transfer land ownership to the assigned citizen officially
      if (land) {
        land.owner_nid = request.user_nid;
        land.owner_name = request.user_name;
        land.owner_phone = request.user_phone;
        land.owner_email = request.user_email;
        land.status = 'Active';
        land.volume_book = request.volume_book;
        land.page_no = request.page_no;
        land.deed_no = request.deed_no;
        land.last_updated = new Date();
        await land.save();
      }

      return res.status(200).json({
        success: true,
        message: `🎉 সফল! জমিটি নাগরিক ${request.user_name} (${request.user_nid})-এর নামে সফলভাবে নামজারি ও বরাদ্দ সম্পন্ন হয়েছে। নাগরিক এখন প্রোফাইলে এই জমি দেখতে পাবেন।`,
        data: request
      });
    } else if (action === 'Reject' || action === 'Cancel') {
      request.status = action === 'Cancel' ? 'Cancelled' : 'Rejected';
      request.ac_land_reviewed_by = req.user.name;
      request.ac_land_reviewed_at = new Date();
      request.rejection_reason = rejection_reason || 'তথ্য বা নথিপত্র অসম্পূর্ণ';
      await request.save();

      // Revert land status to Active
      if (land) {
        land.status = 'Active';
        await land.save();
      }

      return res.status(200).json({
        success: true,
        message: `❌ অনুরোধটি বাতিল/প্রত্যাখ্যাত করা হয়েছে (${request.status})।`,
        data: request
      });
    } else {
      return res.status(400).json({ success: false, message: 'অবৈধ একশন। Approve অথবা Reject নির্বাচন করুন।' });
    }
  } catch (err) {
    console.error('Review error:', err);
    return res.status(500).json({ success: false, message: 'পর্যালোচনা ব্যর্থ হয়েছে।', error: err.message });
  }
});

module.exports = router;
