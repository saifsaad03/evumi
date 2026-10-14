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
// Register Office searches land by cascade parameters
router.get('/search-land', verifyToken, async (req, res) => {
  try {
    const { division, district, upazila, mouza, jl_no, khatian_no, dag_no } = req.query;

    const query = {};
    if (division) query.division = division;
    if (district) query.district = district;
    if (upazila) query.upazila = upazila;
    if (mouza) query.mouza = mouza;
    if (jl_no) query.jl_no = jl_no;
    if (khatian_no) query.khatian_no = khatian_no;
    if (dag_no) query.dag_no = dag_no;

    const records = await LandRecord.find(query);

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জমি খোঁজা ব্যর্থ হয়েছে।' });
  }
});

// GET /api/assign/search-user
// Register Office finds citizen by NID, phone, or email
router.get('/search-user', verifyToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'অনুসন্ধানের জন্য NID, ফোন বা ইমেইল দিন।' });
    }

    const user = await User.findOne({
      $or: [
        { nid: query.trim() },
        { phone: query.trim() },
        { email: query.trim().toLowerCase() }
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

    // Check if land is already pending review
    if (land.status === 'Pending_AC_Land_Review' || land.status === 'Pending_Mutation') {
      return res.status(400).json({
        success: false,
        message: `এই জমিটি বর্তমানে '${land.status}' অবস্থায় রয়েছে। নতুন অ্যাসাইনমেন্ট করা সম্ভব নয়।`
      });
    }

    // Verify citizen
    const citizen = await User.findOne({ nid: user_nid.trim() });
    if (!citizen) {
      return res.status(404).json({ success: false, message: 'প্রদত্ত এনআইডিধারী নাগরিক নিবন্ধিত নয়।' });
    }

    // Verify citizen's email OTP
    const cleanOtp = otp.toString().trim();
    const otpRecord = await OtpVerification.findOne({
      email: citizen.email.toLowerCase(),
      purpose: 'LAND_ASSIGNMENT'
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
