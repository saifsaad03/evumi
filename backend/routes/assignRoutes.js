const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const User = require('../models/User');
const LandAssignRequest = require('../models/LandAssignRequest');
const Dag = require('../models/Dag');
const Khatian = require('../models/Khatian');
const { logActivity } = require('../utils/auditLogger');
const OtpVerification = require('../models/OtpVerification');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  findUserByNid,
  findUserByEmail,
  findLatestAssignOtp,
  updateOtpRecord,
  deleteAssignOtps
} = require('../utils/dbStore');

const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

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
// Standard Land Identification Parameters: Mouza Number + Dag Number + Khatian Number
// Supports partial assignment: Multiple citizens can be assigned portions of the same Dag,
// preserving the total area sum across all portions and remaining available land.
router.get('/search-land', verifyToken, async (req, res) => {
  try {
    const { division, district, upazila, mouza, jl_no, khatian_no, dag_no } = req.query;

    const cleanDag = (dag_no || '').toString().trim();
    const cleanMouza = (mouza || '').toString().trim();
    const cleanKhatian = (khatian_no || '').toString().trim();
    const cleanJl = (jl_no || '').toString().trim();

    if (!cleanDag || !cleanMouza) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        meta: null
      });
    }

    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);
    const engKhatian = cleanKhatian ? toEnglishDigits(cleanKhatian) : '';
    const bngKhatian = cleanKhatian ? toBengaliDigits(cleanKhatian) : '';

    const dagMatch = {
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    };

    // 1. Master Dag Area configured by Super Admin in Dag collection
    const adminDag = await Dag.findOne({
      mouza_name: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    });

    const totalDagArea = adminDag && adminDag.total_area_decimal ? Number(adminDag.total_area_decimal) : 20;

    // 2. Find all approved citizen lands in this Dag
    const citizenLands = await LandRecord.find({
      ...dagMatch,
      owner_nid: { $nin: ['1000000000000', 'GOVT-KHAS-01', 'অনলাইনে রেকর্ড নেই', ''] },
      owner_name: { $not: /সরকার|অনলাইনে অনিবন্ধিত/ },
      status: { $in: ['Active', 'Pending_Mutation'] }
    });

    const assignedArea = Number(citizenLands.reduce((acc, l) => acc + (Number(l.total_area_decimal) || 0), 0).toFixed(4));

    // 3. Find all pending assignment requests in this Dag
    const pendingRequests = await LandAssignRequest.find({
      ...dagMatch,
      status: 'Pending_AC_Land_Review'
    });

    const pendingArea = Number(pendingRequests.reduce((acc, r) => acc + (Number(r.area_decimal) || 0), 0).toFixed(4));

    // 4. Calculate available assignable area for this Dag
    const availableArea = Math.max(0, Number((totalDagArea - assignedArea - pendingArea).toFixed(4)));

    // 5. Find or create unassigned pool record for this Dag
    let unassignedRecord = await LandRecord.findOne({
      ...dagMatch,
      $or: [
        { owner_nid: 'অনলাইনে রেকর্ড নেই' },
        { owner_nid: '1000000000000' },
        { owner_nid: 'GOVT-KHAS-01' },
        { owner_name: 'অনলাইনে অনিবন্ধিত' },
        { owner_name: /গণপ্রজাতন্ত্রী বাংলাদেশ সরকার|খাস/ }
      ]
    });

    const initialKhatian = cleanKhatian || adminDag?.khatian_no || '১';

    if (!unassignedRecord) {
      unassignedRecord = new LandRecord({
        record_id: `rec_${Date.now()}_${engDag}`,
        division: division || 'রাজশাহী',
        district: district || 'বগুড়া',
        upazila: upazila || 'শিবগঞ্জ',
        mouza: cleanMouza,
        jl_no: cleanJl,
        khatian_no: initialKhatian,
        dag_no: cleanDag,
        owner_nid: 'অনলাইনে রেকর্ড নেই',
        owner_name: 'অনলাইনে অনিবন্ধিত',
        owner_phone: 'N/A',
        owner_email: '',
        total_area_decimal: totalDagArea,
        available_area_decimal: availableArea,
        volume_book: 'VOL-KHAS-2026',
        page_no: '০১',
        deed_no: `GOV-${engDag}-${Date.now().toString().slice(-4)}`,
        sub_registry_code: 'SR-BOG-SHIB-01',
        status: availableArea > 0 ? 'Active' : (pendingArea > 0 ? 'Pending_AC_Land_Review' : 'Sold')
      });
      await unassignedRecord.save();
    } else {
      unassignedRecord.total_area_decimal = totalDagArea;
      unassignedRecord.available_area_decimal = availableArea;
      if (cleanKhatian && unassignedRecord.khatian_no !== cleanKhatian) {
        unassignedRecord.khatian_no = cleanKhatian;
      }
      if (availableArea > 0) {
        unassignedRecord.status = 'Active';
      } else if (pendingArea > 0) {
        unassignedRecord.status = 'Pending_AC_Land_Review';
      } else {
        unassignedRecord.status = 'Sold';
      }
      unassignedRecord.last_updated = new Date();
      await unassignedRecord.save();
    }

    const meta = {
      total_dag_area: totalDagArea,
      assigned_area: assignedArea,
      pending_area: pendingArea,
      available_area: availableArea,
      existing_owners: citizenLands.map(l => ({
        _id: l._id,
        name: l.owner_name,
        nid: l.owner_nid,
        phone: l.owner_phone,
        area_decimal: l.total_area_decimal,
        volume_book: l.volume_book,
        page_no: l.page_no,
        deed_no: l.deed_no
      })),
      pending_requests: pendingRequests.map(r => ({
        _id: r._id,
        request_id: r.request_id,
        name: r.user_name,
        nid: r.user_nid,
        area_decimal: r.area_decimal,
        volume_book: r.volume_book,
        page_no: r.page_no
      }))
    };

    return res.status(200).json({
      success: true,
      count: 1,
      data: [unassignedRecord],
      meta
    });
  } catch (err) {
    console.error('Assign search-land error:', err);
    return res.status(500).json({ success: false, message: 'জমি খোঁজা ব্যর্থ হয়েছে।' });
  }
});

// PUT /api/assign/update-khatian
// Directly updates Khatian Number for a Land Record in MongoDB from UI
router.put('/update-khatian', verifyToken, async (req, res) => {
  try {
    const { land_record_id, khatian_no } = req.body;

    if (!land_record_id || !khatian_no) {
      return res.status(400).json({
        success: false,
        message: 'জমির আইডি এবং নতুন খতিয়ান নম্বর প্রদান আবশ্যক।'
      });
    }

    const cleanKhatian = khatian_no.toString().trim();
    const land = await LandRecord.findById(land_record_id);
    if (!land) {
      return res.status(404).json({ success: false, message: 'জমির রেকর্ড পাওয়া যায়নি।' });
    }

    land.khatian_no = cleanKhatian;
    land.last_updated = new Date();
    await land.save();

    logActivity({
      req,
      action_type: 'KHATIAN_UPDATED',
      module: 'Land_Management',
      description: `${req.user?.role || 'কর্মকর্তা'} কর্তৃক খতিয়ান নম্বর হালনাগাদ করা হয়েছে: ${cleanKhatian}`,
      target_resource: `মৌজা: ${land.mouza}, দাগ: ${land.dag_no}, খতিয়ান: ${cleanKhatian}`,
      details: { old_khatian: land.khatian_no, new_khatian: cleanKhatian }
    });

    return res.status(200).json({
      success: true,
      message: `✅ খতিয়ান নম্বর সফলভাবে ডাটাবেজে আপডেট হয়েছে: ${cleanKhatian}`,
      data: land
    });
  } catch (err) {
    console.error('Update khatian error:', err);
    return res.status(500).json({ success: false, message: 'খতিয়ান নম্বর আপডেট ব্যর্থ হয়েছে।' });
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
// Register Office assigns land (full or partial) to user -> sends to AC Land with status Pending_AC_Land_Review
// Standard parameter: Mouza + Dag + Khatian Number. Supports multiple partial assignments from the same Dag.
router.post('/create-request', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      land_record_id,
      user_nid,
      volume_book,
      page_no,
      deed_no,
      khatian_no,
      assign_area,
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

    const cleanDag = (land.dag_no || '').toString().trim();
    const cleanMouza = (land.mouza || '').toString().trim();
    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);

    const dagMatch = {
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    };

    // Calculate real-time available area
    const adminDag = await Dag.findOne({
      mouza_name: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    });
    const totalDagArea = adminDag && adminDag.total_area_decimal ? Number(adminDag.total_area_decimal) : Number(land.total_area_decimal || 20);

    const citizenLands = await LandRecord.find({
      ...dagMatch,
      owner_nid: { $nin: ['1000000000000', 'GOVT-KHAS-01', 'অনলাইনে রেকর্ড নেই', ''] },
      owner_name: { $not: /সরকার|অনলাইনে অনিবন্ধিত/ },
      status: { $in: ['Active', 'Pending_Mutation'] }
    });
    const assignedArea = Number(citizenLands.reduce((acc, l) => acc + (Number(l.total_area_decimal) || 0), 0).toFixed(4));

    const pendingRequests = await LandAssignRequest.find({
      ...dagMatch,
      status: 'Pending_AC_Land_Review'
    });
    const pendingArea = Number(pendingRequests.reduce((acc, r) => acc + (Number(r.area_decimal) || 0), 0).toFixed(4));

    const availableArea = Math.max(0, Number((totalDagArea - assignedArea - pendingArea).toFixed(4)));

    if (availableArea <= 0) {
      return res.status(400).json({
        success: false,
        message: `⚠️ এই দাগের সম্পূর্ণ জমি (${totalDagArea} শতক) ইতিমধ্যে বরাদ্দ সম্পন্ন বা পেন্ডিং রয়েছে। নতুন বরাদ্দ সম্ভব নয়।`
      });
    }

    const rawAssignArea = assign_area ? toEnglishDigits(assign_area.toString()) : availableArea;
    const requestedArea = parseFloat(rawAssignArea);

    if (isNaN(requestedArea) || requestedArea <= 0) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে বৈধ বরাদ্দকৃত জমির পরিমাণ (শতক) প্রদান করুন।'
      });
    }

    if (requestedArea > availableArea) {
      return res.status(400).json({
        success: false,
        message: `⚠️ অপর্যাপ্ত জমি! এই দাগে অবশিষ্ট বরাদ্দযোগ্য জমি রয়েছে ${availableArea} শতক, কিন্তু বরাদ্দ চাওয়া হয়েছে ${requestedArea} শতক।`
      });
    }

    // Check LegalStatus for Court Case / Stay Order
    const LegalStatus = require('../models/LegalStatus');
    const legalNotice = await LegalStatus.findOne({
      $and: [
        {
          $or: [
            { dag_no: cleanDag },
            { dag_no: engDag },
            { dag_no: bngDag }
          ]
        },
        cleanMouza ? { mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') } } : {}
      ]
    });

    if (legalNotice && (legalNotice.has_court_case || legalNotice.stay_order)) {
      return res.status(400).json({
        success: false,
        message: legalNotice.stay_order
          ? `⛔ এই জমিতে আদালতের স্থগিতাদেশ (Stay Order) বলবৎ রয়েছে! [${legalNotice.case_details || ''}] বরাদ্দ প্রদান সম্ভব নয়।`
          : `⚖️ এই জমির ওপর আদালতে সক্রিয় মোকদ্দমা বিচারাধীন রয়েছে! [${legalNotice.case_details || ''}] বরাদ্দ প্রদান সম্ভব নয়।`
      });
    }

    // Verify citizen with English/Bengali digits
    const rawNid = user_nid.toString().trim();
    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    let citizen = null;
    try {
      citizen = await User.findOne({
        $or: [
          { nid: rawNid },
          { nid: engNid },
          { nid: bngNid }
        ]
      });
    } catch (e) {
      console.warn('DB lookup failed in create-request:', e.message);
    }

    if (!citizen) {
      citizen = (await findUserByNid(rawNid)) ||
                (await findUserByNid(engNid)) ||
                (await findUserByNid(bngNid));
    }

    if (!citizen) {
      return res.status(404).json({ success: false, message: 'প্রদত্ত এনআইডিধারী নাগরিক নিবন্ধিত নয়।' });
    }

    // Verify citizen's email OTP
    const cleanOtp = toEnglishDigits((otp || '').toString().trim());
    const otpRecord = await findLatestAssignOtp(citizen.email, citizen.nid);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'নাগরিকের ইমেইলে কোনো সক্রিয় ওটিপি রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে প্রথমে "ওটিপি পাঠান" এ ক্লিক করুন।'
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
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

    const savedOtp = toEnglishDigits((otpRecord.otp || '').toString().trim());
    if (savedOtp !== cleanOtp) {
      const newAttempts = (otpRecord.attempts || 0) + 1;
      await updateOtpRecord(otpRecord, { attempts: newAttempts });
      return res.status(400).json({
        success: false,
        message: `ভুল ওটিপি কোড! নাগরিকের ইমেইল (${citizen.email}) এ প্রেরিত কোডটি দিন। (বাকি চেষ্টা: ${5 - newAttempts})`
      });
    }

    // Mark OTP as verified
    await updateOtpRecord(otpRecord, { verified: true });

    const requestId = 'REQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

    const newRequest = new LandAssignRequest({
      request_id: requestId,
      land_record_id: land._id,
      division: land.division || 'রাজশাহী',
      district: land.district || 'বগুড়া',
      upazila: land.upazila || 'শিবগঞ্জ',
      mouza: land.mouza,
      jl_no: land.jl_no,
      khatian_no: khatian_no ? khatian_no.toString().trim() : land.khatian_no,
      dag_no: land.dag_no,
      area_decimal: requestedArea,
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

    // Decrement pool record available area. If still has land, stays Active for other users!
    const remainingAfterRequest = Math.max(0, Number((availableArea - requestedArea).toFixed(4)));
    land.available_area_decimal = remainingAfterRequest;
    if (remainingAfterRequest > 0) {
      land.status = 'Active';
    } else {
      land.status = 'Pending_AC_Land_Review';
    }
    land.volume_book = volume_book.trim();
    land.page_no = page_no.trim();
    if (deed_no) land.deed_no = deed_no.trim();
    land.last_updated = new Date();
    await land.save();

    // Successfully processed, delete consumed OTP
    await deleteAssignOtps(citizen.email, citizen.nid);

    logActivity({
      req,
      action_type: 'GOVT_LAND_ASSIGNED',
      module: 'Land_Assignment',
      description: `সাব-রেজিস্ট্রি অফিসার কর্তৃক নাগরিক ${citizen.name}-এর অনুকূলে জমি বরাদ্দ প্রস্তাব তৈরি (${requestedArea} শতক, অবশিষ্ট: ${remainingAfterRequest} শতক)`,
      target_resource: `নাগরিক: ${citizen.name} (NID: ${citizen.nid}), মৌজা: ${land.mouza}, দাগ: ${land.dag_no}, পরিমাণ: ${requestedArea} শতক`,
      details: { area: requestedArea, remaining: remainingAfterRequest, total_dag: totalDagArea }
    });

    return res.status(201).json({
      success: true,
      message: `✅ জমিটি (${requestedArea} শতক) নাগরিক ${citizen.name}-কে বরাদ্দের অনুরোধ সফলভাবে এসি ল্যান্ড (AC Land) অফিসে পাঠানো হয়েছে!`,
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

    const cleanDag = (request.dag_no || '').toString().trim();
    const cleanMouza = (request.mouza || '').toString().trim();
    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);

    const dagMatch = {
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    };

    const adminDag = await Dag.findOne({
      mouza_name: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    });
    const totalDagArea = adminDag && adminDag.total_area_decimal ? Number(adminDag.total_area_decimal) : Number(land?.total_area_decimal || 20);

    if (action === 'Approve') {
      request.status = 'Approved';
      request.ac_land_reviewed_by = req.user.name;
      request.ac_land_reviewed_at = new Date();
      if (remarks) request.remarks = remarks;
      await request.save();

      // Create a dedicated citizen LandRecord for this assigned portion
      const citizenLand = new LandRecord({
        record_id: `rec_assign_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
        division: request.division,
        district: request.district,
        upazila: request.upazila,
        mouza: request.mouza,
        jl_no: request.jl_no,
        khatian_no: request.khatian_no,
        dag_no: request.dag_no,
        owner_nid: request.user_nid,
        owner_name: request.user_name,
        owner_phone: request.user_phone,
        owner_email: request.user_email,
        total_area_decimal: request.area_decimal,
        available_area_decimal: request.area_decimal,
        volume_book: request.volume_book,
        page_no: request.page_no,
        deed_no: request.deed_no,
        sub_registry_code: 'SR-OFFICE-01',
        status: 'Active',
        parent_record_id: land ? land._id : null
      });
      await citizenLand.save();

      // Recalculate remaining pool for this Dag
      if (land) {
        const allCitizenLands = await LandRecord.find({
          ...dagMatch,
          owner_nid: { $nin: ['1000000000000', 'GOVT-KHAS-01', 'অনলাইনে রেকর্ড নেই', ''] },
          owner_name: { $not: /সরকার|অনলাইনে অনিবন্ধিত/ },
          status: { $in: ['Active', 'Pending_Mutation'] }
        });
        const currentAssignedArea = Number(allCitizenLands.reduce((acc, l) => acc + (Number(l.total_area_decimal) || 0), 0).toFixed(4));

        const allPendingReqs = await LandAssignRequest.find({
          ...dagMatch,
          status: 'Pending_AC_Land_Review'
        });
        const currentPendingArea = Number(allPendingReqs.reduce((acc, r) => acc + (Number(r.area_decimal) || 0), 0).toFixed(4));

        const remainingUnassigned = Math.max(0, Number((totalDagArea - currentAssignedArea - currentPendingArea).toFixed(4)));

        land.available_area_decimal = remainingUnassigned;
        if (remainingUnassigned > 0) {
          land.status = 'Active';
        } else if (currentPendingArea > 0) {
          land.status = 'Pending_AC_Land_Review';
        } else {
          land.status = 'Sold';
        }
        land.last_updated = new Date();
        await land.save();
      }

      return res.status(200).json({
        success: true,
        message: `🎉 সফল! জমিটি (${request.area_decimal} শতক) নাগরিক ${request.user_name} (${request.user_nid})-এর নামে সফলভাবে নামজারি ও বরাদ্দ সম্পন্ন হয়েছে।`,
        data: request
      });
    } else if (action === 'Reject' || action === 'Cancel') {
      request.status = action === 'Cancel' ? 'Cancelled' : 'Rejected';
      request.ac_land_reviewed_by = req.user.name;
      request.ac_land_reviewed_at = new Date();
      request.rejection_reason = rejection_reason || 'তথ্য বা নথিপত্র অসম্পূর্ণ';
      await request.save();

      // Restore available area to pool
      if (land) {
        const allCitizenLands = await LandRecord.find({
          ...dagMatch,
          owner_nid: { $nin: ['1000000000000', 'GOVT-KHAS-01', 'অনলাইনে রেকর্ড নেই', ''] },
          owner_name: { $not: /সরকার|অনলাইনে অনিবন্ধিত/ },
          status: { $in: ['Active', 'Pending_Mutation'] }
        });
        const currentAssignedArea = Number(allCitizenLands.reduce((acc, l) => acc + (Number(l.total_area_decimal) || 0), 0).toFixed(4));

        const allPendingReqs = await LandAssignRequest.find({
          ...dagMatch,
          status: 'Pending_AC_Land_Review'
        });
        const currentPendingArea = Number(allPendingReqs.reduce((acc, r) => acc + (Number(r.area_decimal) || 0), 0).toFixed(4));

        const remainingUnassigned = Math.max(0, Number((totalDagArea - currentAssignedArea - currentPendingArea).toFixed(4)));

        land.available_area_decimal = remainingUnassigned;
        land.status = remainingUnassigned > 0 ? 'Active' : (currentPendingArea > 0 ? 'Pending_AC_Land_Review' : 'Sold');
        land.last_updated = new Date();
        await land.save();
      }

      return res.status(200).json({
        success: true,
        message: `❌ অনুরোধটি বাতিল/প্রত্যাখ্যাত করা হয়েছে (${request.status}) এবং ${request.area_decimal} শতক জমি পুনরায় বরাদ্দযোগ্য হিসেবে অবমুক্ত করা হয়েছে।`,
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
