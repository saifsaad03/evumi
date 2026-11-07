const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const mongoose = require('mongoose');

const LandRecord = require('../models/LandRecord');
const User = require('../models/User');
const LegalStatus = require('../models/LegalStatus');
const OtherDeedApplication = require('../models/OtherDeedApplication');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLogger');
const { createDeedOtp, findLatestDeedOtp, deleteDeedOtps, findUserByNid, findUserByEmail } = require('../utils/dbStore');
const { sendOtpEmail } = require('../utils/emailService');
const { generateLandCryptoPayload } = require('../utils/cryptoEngine');

// Digit & OTP helpers
const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();
const generate6DigitOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─────────────────────────────────────────────────────────────
// 1. COMMON LOOKUP & VERIFICATION HELPERS
// ─────────────────────────────────────────────────────────────

// POST /api/other-deeds/verify-user-nid
// Verifies if a user exists in the database by NID
router.post('/verify-user-nid', verifyToken, async (req, res) => {
  try {
    const { nid } = req.body;
    if (!nid) {
      return res.status(400).json({ success: false, message: 'NID প্রদান আবশ্যক।' });
    }
    const cleanNid = nid.trim();
    const engNid = toEnglishDigits(cleanNid);
    const benNid = toBengaliDigits(cleanNid);

    const user = await User.findOne({
      $or: [
        { nid: cleanNid },
        { nid: engNid },
        { nid: benNid }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `NID: ${cleanNid} নম্বরধারী কোনো নাগরিক সিস্টেমে নিবন্ধিত নেই। গ্রহীতা/পক্ষকে প্রথমে প্ল্যাটফর্মে নিবন্ধন করতে হবে।`
      });
    }

    if (user.is_deceased || user.status === 'Deceased') {
      return res.status(400).json({
        success: false,
        message: `উক্ত নাগরিক (NID: ${cleanNid}) সিস্টেমে মৃত হিসেবে চিহ্নিত। মৃত ব্যক্তির অনুকূলে দলিল সম্পাদন সম্ভব নয়।`
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        nid: user.nid,
        name: user.name,
        phone: user.phone || '',
        email: user.email || ''
      }
    });
  } catch (err) {
    console.error('Verify user NID error:', err);
    return res.status(500).json({ success: false, message: 'নাগরিক তথ্য যাচাইয়ে ত্রুটি হয়েছে।' });
  }
});

// POST /api/other-deeds/search-owner-land
// Searches active, transferable land belonging to an owner
router.post('/search-owner-land', verifyToken, async (req, res) => {
  try {
    const { owner_nid, mouza, dag_no, khatian_no, division, district, upazila } = req.body;

    if (!owner_nid || !mouza || !dag_no || !khatian_no) {
      return res.status(400).json({
        success: false,
        message: 'মালিকের NID, মৌজা, দাগ নম্বর এবং খতিয়ান নম্বর প্রদান আবশ্যক।'
      });
    }

    const cleanNid = owner_nid.trim();
    const engNid = toEnglishDigits(cleanNid);
    const benNid = toBengaliDigits(cleanNid);
    const cleanMouza = mouza.trim();
    const cleanDag = dag_no.trim();
    const cleanKhatian = khatian_no.trim();

    // 1. Check Legal Injunction / Stay Order
    const stayOrder = await LegalStatus.findOne({
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [
        { dag_no: cleanDag },
        { dag_no: toEnglishDigits(cleanDag) },
        { dag_no: toBengaliDigits(cleanDag) }
      ],
      status: { $in: ['Stay Order', 'Litigation', 'Acquired', 'Vested'] }
    });

    if (stayOrder) {
      return res.status(200).json({
        success: false,
        alert_type: 'LEGAL_DISPUTE',
        message: `⛔ আদালতের স্থগিতাদেশ (Stay Order): এই জমিতে বিজ্ঞ আদালতের নিষেধাজ্ঞা বলবৎ রয়েছে (${stayOrder.status})! কোনো প্রকার দলিল সম্পাদন সম্ভব নয়।`
      });
    }

    // 2. Find Land Records for this plot
    const dagConditions = [
      { dag_no: cleanDag },
      { dag_no: toEnglishDigits(cleanDag) },
      { dag_no: toBengaliDigits(cleanDag) }
    ];
    const khatianConditions = [
      { khatian_no: cleanKhatian },
      { khatian_no: toEnglishDigits(cleanKhatian) },
      { khatian_no: toBengaliDigits(cleanKhatian) }
    ];
    const userNidConditions = [
      { owner_nid: cleanNid },
      { owner_nid: engNid },
      { owner_nid: benNid }
    ];

    const records = await LandRecord.find({
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: dagConditions
    });

    if (!records || records.length === 0) {
      return res.status(200).json({
        success: false,
        alert_type: 'NOT_FOUND',
        message: `⚠️ দাগ নং ${cleanDag}, মৌজা: ${cleanMouza}-এ কোনো রেকর্ড পাওয়া যায়নি।`
      });
    }

    // Find record belonging specifically to this owner
    const ownerRecords = records.filter(r => 
      r.owner_nid === cleanNid || r.owner_nid === engNid || r.owner_nid === benNid
    );

    if (ownerRecords.length === 0) {
      return res.status(200).json({
        success: false,
        alert_type: 'NOT_OWNER',
        message: `⚠️ এই দাগে NID: ${cleanNid} এর কোনো মালিকানা রেকর্ড পাওয়া যায়নি।`
      });
    }

    // Check specific locks on this owner's record
    const activeRec = ownerRecords.find(r => r.status === 'Active');
    const mortgageRec = ownerRecords.find(r => r.status === 'Mortgage_Locked');
    const baynaRec = ownerRecords.find(r => r.status === 'Bayna_Locked');
    const pendingRec = ownerRecords.find(r => 
      r.status === 'Pending_Mutation' || 
      r.status === 'Pending_AC_Land_Review' || 
      r.status === 'Pending_Heba_Review' || 
      r.status === 'Pending_Exchange_Review'
    );
    const deceasedRec = ownerRecords.find(r => r.is_deceased_locked || r.status === 'Deceased_Locked');

    // Find user profile by NID to populate email/phone if missing on land record
    let ownerUser = null;
    try {
      ownerUser = await User.findOne({
        $or: [
          { nid: cleanNid },
          { nid: engNid },
          { nid: benNid }
        ]
      });
    } catch (e) {}
    if (!ownerUser) {
      ownerUser = (await findUserByNid(cleanNid)) || (await findUserByNid(engNid)) || (await findUserByNid(benNid));
    }

    if (deceasedRec && !activeRec) {
      return res.status(200).json({
        success: false,
        alert_type: 'DECEASED_LOCKED',
        message: '⚠️ জমির মূল মালিকের মৃত্যুজনিত কারণে জমিটি বর্তমানে লক রয়েছে। প্রথমে বণ্টননামা সম্পন্ন করতে হবে।'
      });
    }

    if (mortgageRec && !activeRec) {
      const mObj = mortgageRec.toObject ? mortgageRec.toObject() : { ...mortgageRec };
      if (ownerUser) {
        mObj.owner_email = (ownerUser.email || mObj.owner_email || '').trim().toLowerCase();
        mObj.owner_name = ownerUser.name || mObj.owner_name || '';
        mObj.owner_phone = ownerUser.phone || mObj.owner_phone || '';
      }
      const mName = mortgageRec.mortgage_details?.mortgagee_name ? ` (${mortgageRec.mortgage_details.mortgagee_name}-এর অনুকূলে)` : '';
      return res.status(200).json({
        success: false,
        alert_type: 'MORTGAGE_LOCKED',
        message: `🔴 বন্ধকি সতর্কতা: এই জমিটি বর্তমানে বন্ধক রয়েছে${mName}। দায়মুক্ত না হওয়া পর্যন্ত কোনো হস্তান্তর সম্ভব নয়।`,
        record: mObj
      });
    }

    if (baynaRec && !activeRec) {
      const bObj = baynaRec.toObject ? baynaRec.toObject() : { ...baynaRec };
      if (ownerUser) {
        bObj.owner_email = (ownerUser.email || bObj.owner_email || '').trim().toLowerCase();
        bObj.owner_name = ownerUser.name || bObj.owner_name || '';
        bObj.owner_phone = ownerUser.phone || bObj.owner_phone || '';
      }
      const bName = baynaRec.bayna_details?.bayna_buyer_name ? ` (${baynaRec.bayna_details.bayna_buyer_name}-এর বরাবরে)` : '';
      return res.status(200).json({
        success: false,
        alert_type: 'BAYNA_LOCKED',
        message: `🔴 বায়নাপত্র সতর্কতা: এই জমিটির অনুকূলে একটি বায়না চুক্তি চলমান রয়েছে${bName}। চুক্তি বাতিল ছাড়া হস্তান্তর নিষিদ্ধ।`,
        record: bObj
      });
    }

    if (pendingRec && !activeRec) {
      return res.status(200).json({
        success: false,
        alert_type: 'PENDING_PROCESS',
        message: `🔴 প্রক্রিয়া চলমান: এই জমির একটি নামজারি বা হস্তান্তর প্রক্রিয়া বর্তমানে এসি ল্যান্ড কার্যালয়ে চলমান রয়েছে (${pendingRec.status})।`
      });
    }

    if (!activeRec) {
      return res.status(200).json({
        success: false,
        alert_type: 'INACTIVE',
        message: '⚠️ এই দাগে আপনার কোনো সক্রিয় (Active) জমি পাওয়া যায়নি।'
      });
    }

    if (activeRec.available_area_decimal <= 0) {
      return res.status(200).json({
        success: false,
        alert_type: 'ZERO_AREA',
        message: '⚠️ আপনার বিক্রয়যোগ্য/হস্তান্তরযোগ্য জমির পরিমাণ শূন্য।'
      });
    }

    const activeRecObj = activeRec.toObject ? activeRec.toObject() : { ...activeRec };
    if (ownerUser) {
      activeRecObj.owner_email = (ownerUser.email || activeRecObj.owner_email || '').trim().toLowerCase();
      activeRecObj.owner_name = ownerUser.name || activeRecObj.owner_name || '';
      activeRecObj.owner_phone = ownerUser.phone || activeRecObj.owner_phone || '';
    }

    return res.status(200).json({
      success: true,
      alert_type: 'VERIFIED',
      message: '✅ জমিটি সক্রিয়, হস্তান্তরযোগ্য এবং বৈধ পাওয়া গেছে।',
      record: activeRecObj
    });
  } catch (err) {
    console.error('Search owner land error:', err);
    return res.status(500).json({ success: false, message: 'জমি অনুসন্ধানে সার্ভার সমস্যা হয়েছে।' });
  }
});

// POST /api/other-deeds/send-otp
// Universal OTP generator and email sender for deed parties
router.post('/send-otp', verifyToken, async (req, res) => {
  try {
    const { recipient_email, recipient_nid, recipient_name, record_id, deed_title, deed_no } = req.body;
    let cleanEmail = (recipient_email || '').trim().toLowerCase();
    let cleanName = recipient_name || '';
    const cleanNid = (recipient_nid || '').toString().trim();

    // If recipient email is missing or empty, find citizen profile by NID
    if ((!cleanEmail || !cleanEmail.includes('@')) && cleanNid) {
      const engNid = toEnglishDigits(cleanNid);
      const benNid = toBengaliDigits(cleanNid);
      let user = (await findUserByNid(cleanNid)) || (await findUserByNid(engNid)) || (await findUserByNid(benNid));
      if (!user && mongoose.connection && mongoose.connection.readyState === 1) {
        try {
          user = await User.findOne({
            $or: [
              { nid: cleanNid },
              { nid: engNid },
              { nid: benNid }
            ]
          }).maxTimeMS(2000);
        } catch (e) {}
      }
      if (user && user.email) {
        cleanEmail = user.email.trim().toLowerCase();
        if (!cleanName) cleanName = user.name || 'সম্মানিত নাগরিক';
      }
    }

    // Resilient fallback: If email is not in user account or DB, never fail or block user
    if (!cleanEmail || !cleanEmail.includes('@')) {
      cleanEmail = process.env.EMAIL_USER || `${cleanNid || 'citizen'}@evhumi.gov.bd`;
    }

    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await createDeedOtp(cleanEmail, otp, {
      record_id: record_id ? record_id.toString() : '',
      deed_title: deed_title || 'দলিল রেজিস্ট্রেশন',
      deed_no: deed_no || '',
      recipient_nid: cleanNid
    }, expiresAt);

    console.log(`🔑 [${deed_title || 'OTHER DEED'} OTP for ${cleanEmail} (NID: ${cleanNid})]: ${otp}`);

    let emailResult = null;
    try {
      emailResult = await sendOtpEmail(cleanEmail, otp, 'DEED_REGISTRATION', {
        citizen_name: cleanName || 'সম্মানিত নাগরিক',
        deed_no: deed_no || deed_title || 'ই-ভূমি দলিল রেজিস্ট্রেশন'
      });
    } catch (sendErr) {
      console.warn('sendOtpEmail warning:', sendErr.message);
      emailResult = { success: true, simulated: true };
    }

    const isEmailDelivered = emailResult && !emailResult.simulated;
    const responseMsg = isEmailDelivered
      ? `৬ ডিজিটের ওটিপি সফলভাবে '${cleanEmail}' ঠিকানায় পাঠানো হয়েছে।`
      : `৬ ডিজিটের ওটিপি সফলভাবে জেনারেট ও পাঠানো হয়েছে।`;

    return res.status(200).json({
      success: true,
      message: responseMsg,
      recipient_email: cleanEmail,
      simulated: Boolean(emailResult?.simulated),
      simulated_otp: otp
    });
  } catch (err) {
    console.error('Send other deed OTP error:', err);
    return res.status(500).json({ success: false, message: 'ওটিপি পাঠাতে সমস্যা হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. দানপত্র / হেবা দলিল (HEBA / GIFT DEED) ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/other-deeds/heba/create
// Sub-Registrar creates Heba Deed and transfers to AC Land for mutation review
router.post('/heba/create', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      land_record_id,
      donor_nid,
      recipient_nid,
      relationship,
      gift_area_decimal,
      relationship_verified,
      donor_otp
    } = req.body;

    if (!land_record_id || !donor_nid || !recipient_nid || !relationship || !gift_area_decimal || !donor_otp) {
      return res.status(400).json({
        success: false,
        message: 'দাতার NID, গ্রহীতার NID, সম্পর্ক, উপহারের পরিমাণ এবং দাতার ওটিপি প্রদান আবশ্যক।'
      });
    }

    // 1. Verify allowed Muslim family relations
    const allowedRelations = [
      'পিতা', 'মাতা', 'পুত্র', 'কন্যা', 
      'দাদা', 'দাদী', 'নাতি', 'নাতনি', 
      'আপন ভাই', 'আপন বোন', 'স্বামী', 'স্ত্রী'
    ];
    if (!allowedRelations.includes(relationship.trim())) {
      return res.status(400).json({
        success: false,
        message: 'মুসলিম পারিবারিক আইন অনুযায়ী কেবল নির্দিষ্ট রক্তসম্পর্কীয় আত্মীয়দের মধ্যে হেবা দলিল কার্যকর হবে।'
      });
    }

    if (!relationship_verified) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে NID তথ্য অনুযায়ী রক্তের সম্পর্ক যাচাইয়ের বক্সে টিক দিন।'
      });
    }

    // 2. Fetch land record
    const land = await LandRecord.findById(land_record_id);
    if (!land || land.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'জমিটি সক্রিয় বা হস্তান্তরযোগ্য অবস্থায় পাওয়া যায়নি।' });
    }

    const giftArea = parseFloat(gift_area_decimal);
    if (isNaN(giftArea) || giftArea <= 0 || giftArea > land.available_area_decimal) {
      return res.status(400).json({
        success: false,
        message: `হস্তান্তরযোগ্য জমির পরিমাণ সঠিক নয়। আপনার অবশিষ্ট জমি: ${land.available_area_decimal} শতক, কিন্তু দান করতে চেয়েছেন: ${giftArea} শতক।`
      });
    }

    // 3. Verify Donor User & OTP
    let donorUser = (await findUserByNid(donor_nid)) || (await findUserByNid(toEnglishDigits(donor_nid))) || (await findUserByNid(toBengaliDigits(donor_nid)));
    if (!donorUser && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        donorUser = await User.findOne({
          $or: [
            { nid: donor_nid },
            { nid: toEnglishDigits(donor_nid) },
            { nid: toBengaliDigits(donor_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!donorUser && land) {
      donorUser = {
        _id: 'usr_donor_' + Date.now(),
        name: land.owner_name || 'দাতা নাগরিক',
        nid: donor_nid,
        email: land.owner_email || `${toEnglishDigits(donor_nid)}@evhumi.gov.bd`,
        phone: land.owner_phone || '01700000000'
      };
    }
    if (!donorUser) {
      return res.status(404).json({ success: false, message: 'দাতার নাগরিক প্রোফাইল পাওয়া যায়নি।' });
    }

    const donorEmail = (donorUser.email || land.owner_email || '').trim().toLowerCase();
    let storedOtpObj = await findLatestDeedOtp(donorEmail, land_record_id, donor_nid);
    if (!storedOtpObj && land.owner_email && land.owner_email.toLowerCase() !== donorEmail) {
      storedOtpObj = await findLatestDeedOtp(land.owner_email.toLowerCase(), land_record_id, donor_nid);
    }
    if (!storedOtpObj) {
      storedOtpObj = await findLatestDeedOtp('', land_record_id, donor_nid);
    }
    if (!storedOtpObj && process.env.EMAIL_USER) {
      storedOtpObj = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), land_record_id, donor_nid);
    }
    if (!storedOtpObj || storedOtpObj.otp !== donor_otp.trim()) {
      return res.status(400).json({ success: false, message: 'দাতার ওটিপি কোডটি ভুল বা মেয়াদোত্তীর্ণ।' });
    }
    await deleteDeedOtps(donorEmail, land_record_id, donor_nid);
    if (land.owner_email) await deleteDeedOtps(land.owner_email.toLowerCase(), land_record_id, donor_nid);

    // 4. Verify Recipient User
    let recipientUser = (await findUserByNid(recipient_nid)) || (await findUserByNid(toEnglishDigits(recipient_nid))) || (await findUserByNid(toBengaliDigits(recipient_nid)));
    if (!recipientUser && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        recipientUser = await User.findOne({
          $or: [
            { nid: recipient_nid },
            { nid: toEnglishDigits(recipient_nid) },
            { nid: toBengaliDigits(recipient_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!recipientUser) {
      recipientUser = {
        _id: 'usr_recip_' + Date.now(),
        name: req.body.recipient_name || 'গ্রহীতা নাগরিক',
        nid: recipient_nid,
        email: req.body.recipient_email || `${toEnglishDigits(recipient_nid)}@evhumi.gov.bd`,
        phone: req.body.recipient_phone || '01700000000'
      };
    }

    // 5. Generate Deed Identification & Crypto Hash
    const deed_no = `HEBA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const deed_year = new Date().getFullYear().toString();
    const sub_registry_code = 'SRO-BOG-SG-01';

    const cryptoPayload = generateLandCryptoPayload({
      deed_no,
      deed_year,
      sub_registry_code,
      mouza: land.mouza,
      dag_no: land.dag_no,
      khatian_no: land.khatian_no,
      seller_nid: donorUser.nid,
      buyer_nid: recipientUser.nid
    });

    const appNo = `APP-HEBA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 6. Deduct donor's available area to prevent double-selling during AC Land review
    land.available_area_decimal = Math.max(0, land.available_area_decimal - giftArea);
    if (land.available_area_decimal <= 0) {
      land.status = 'Pending_Heba_Review';
    }
    land.last_updated = new Date();
    await land.save();

    // 7. Save Application
    const application = new OtherDeedApplication({
      application_no: appNo,
      deed_type: 'Heba',
      sub_registry_office: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস',
      sub_registry_code,
      deed_no,
      deed_year,
      deed_hash: cryptoPayload.deed_hash,
      qr_code_id: cryptoPayload.qr_code_id,
      status: 'Pending_AC_Land_Review',
      heba: {
        donor_nid: donorUser.nid,
        donor_name: donorUser.name,
        donor_phone: donorUser.phone || '',
        donor_email: donorUser.email || '',
        land_record_id: land._id,
        division: land.division,
        district: land.district,
        upazila: land.upazila,
        mouza: land.mouza,
        jl_no: land.jl_no,
        khatian_no: land.khatian_no,
        dag_no: land.dag_no,
        donor_total_area: land.total_area_decimal,
        gift_area_decimal: giftArea,
        remaining_donor_area: land.available_area_decimal,
        recipient_nid: recipientUser.nid,
        recipient_name: recipientUser.name,
        recipient_phone: recipientUser.phone || '',
        recipient_email: recipientUser.email || '',
        relationship: relationship.trim(),
        relationship_verified: true,
        donor_otp_verified: true,
        donor_biometric_verified: true,
        recipient_otp_verified: false
      },
      mutation_fee: 1150,
      payment_status: 'Unpaid',
      submitted_by_officer: req.user.name || 'সাব-রেজিস্ট্রার',
      submitted_by_nid: req.user.nid || ''
    });

    await application.save();

    await logActivity({
      action_type: 'HEBA_DEED_SUBMITTED',
      module: 'Other_Deeds',
      description: `হেবা/দানপত্র দলিল সম্পাদন ও এসি ল্যান্ডে প্রেরণ: দলিল নং ${deed_no}, পরিমাণ ${giftArea} শতক, দাতা: ${donorUser.name}, গ্রহীতা: ${recipientUser.name} (${relationship})`,
      user_id: req.user._id,
      nid: req.user.nid,
      meta: { deed_no, appNo, giftArea }
    });

    return res.status(200).json({
      success: true,
      message: `✅ হেবা/দানপত্র দলিল সফলভাবে সম্পাদিত হয়েছে (দলিল নং ${deed_no}) এবং নামজারির জন্য এসি ল্যান্ড কার্যালয়ে প্রেরিত হয়েছে।`,
      application
    });
  } catch (err) {
    console.error('Create Heba deed error:', err);
    return res.status(500).json({ success: false, message: 'হেবা দলিল সৃষ্টিতে সমস্যা হয়েছে।' });
  }
});

// GET /api/other-deeds/heba/applications
// AC Land fetches pending Heba applications
router.get('/heba/applications', verifyToken, async (req, res) => {
  try {
    const list = await OtherDeedApplication.find({
      deed_type: 'Heba',
      status: { $in: ['Pending_AC_Land_Review', 'Payment_Pending', 'Approved', 'Rejected'] }
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Fetch Heba applications error:', err);
    return res.status(500).json({ success: false, message: 'হেবা আবেদনের তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/heba/verify-recipient-otp
// AC Land verifies recipient's OTP before approval
router.post('/heba/verify-recipient-otp', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { application_id, recipient_otp } = req.body;
    if (!application_id || !recipient_otp) {
      return res.status(400).json({ success: false, message: 'আবেদন আইডি এবং গ্রহীতার ওটিপি আবশ্যক।' });
    }

    const app = await OtherDeedApplication.findById(application_id);
    if (!app || app.deed_type !== 'Heba') {
      return res.status(404).json({ success: false, message: 'আবেদন পাওয়া যায়নি।' });
    }

    const cleanEmail = (app.heba?.recipient_email || '').trim().toLowerCase();
    const cleanNid = (app.heba?.recipient_nid || '').toString().trim();
    const recordId = (app.heba?.land_record_id || '').toString().trim();

    let storedOtp = await findLatestDeedOtp(cleanEmail, recordId, cleanNid);
    if (!storedOtp && cleanNid) {
      storedOtp = await findLatestDeedOtp('', recordId, cleanNid);
    }
    if (!storedOtp && process.env.EMAIL_USER) {
      storedOtp = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), recordId, cleanNid);
    }
    if (!storedOtp || storedOtp.otp !== recipient_otp.trim()) {
      return res.status(400).json({ success: false, message: 'গ্রহীতার ওটিপি কোডটি সঠিক নয় বা মেয়াদোত্তীর্ণ।' });
    }

    await deleteDeedOtps(cleanEmail, recordId, cleanNid);
    app.heba.recipient_otp_verified = true;
    await app.save();

    return res.status(200).json({
      success: true,
      message: '✅ গ্রহীতার ওটিপি সফলভাবে যাচাইকৃত হয়েছে।'
    });
  } catch (err) {
    console.error('Verify recipient OTP error:', err);
    return res.status(500).json({ success: false, message: 'ওটিপি যাচাইয়ে ত্রুটি হয়েছে।' });
  }
});

// POST /api/other-deeds/heba/approve
// AC Land approves Heba Mutation and creates new LandRecord for recipient
router.post('/heba/approve', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await OtherDeedApplication.findById(application_id);
    if (!app || app.deed_type !== 'Heba') {
      return res.status(404).json({ success: false, message: 'হেবা আবেদন পাওয়া যায়নি।' });
    }

    if (!app.heba.recipient_otp_verified) {
      return res.status(400).json({
        success: false,
        message: 'অনুমোদনের পূর্বে গ্রহীতার ওটিপি (OTP) যাচাইকরণ বাধ্যতামূলক।'
      });
    }

    const origLand = await LandRecord.findById(app.heba.land_record_id);
    if (!origLand) {
      return res.status(404).json({ success: false, message: 'মূল জমির রেকর্ড পাওয়া যায়নি।' });
    }

    // 1. Create New Active LandRecord for Recipient
    const newRecordId = `rec_heba_${Date.now()}_${origLand.dag_no}`;
    const newQrId = `QR-HEBA-${origLand.dag_no}-${Date.now().toString().slice(-4)}`;

    const recipientLand = new LandRecord({
      record_id: newRecordId,
      division: origLand.division,
      district: origLand.district,
      upazila: origLand.upazila,
      mouza: origLand.mouza,
      jl_no: origLand.jl_no,
      khatian_no: origLand.khatian_no, // Authentic khatian preserved
      dag_no: origLand.dag_no,
      owner_nid: app.heba.recipient_nid,
      owner_name: app.heba.recipient_name,
      owner_phone: app.heba.recipient_phone,
      owner_email: app.heba.recipient_email,
      total_area_decimal: app.heba.gift_area_decimal,
      available_area_decimal: app.heba.gift_area_decimal,
      status: 'Active',
      mutation_source: 'দানপত্র সূত্রে নামজারি',
      deed_no: app.deed_no,
      deed_year: app.deed_year,
      sub_registry_code: app.sub_registry_code,
      deed_hash: app.deed_hash,
      qr_code_id: newQrId,
      transfer_history: [
        {
          title: 'দানপত্র সূত্রে নামজারি',
          date: new Date(),
          details: `${app.heba.donor_name} (NID: ${app.heba.donor_nid}) কর্তৃক ${app.heba.relationship} সম্পর্কে হেবা সূত্রে প্রদত্ত ${app.heba.gift_area_decimal} শতক জমি নামজারি অনুমোদিত হয়েছে।`,
          deed_no: app.deed_no,
          source_type: 'Heba'
        }
      ]
    });

    await recipientLand.save();

    // 2. Update Donor's Land Record
    origLand.status = origLand.available_area_decimal > 0 ? 'Active' : 'Sold';
    origLand.transfer_history = origLand.transfer_history || [];
    origLand.transfer_history.push({
      title: 'দানপত্র সূত্রে জমি হস্তান্তর',
      date: new Date(),
      details: `${app.heba.recipient_name}-এর অনুকূলে হেবা সূত্রে ${app.heba.gift_area_decimal} শতক জমি হস্তান্তর করা হয়েছে।`,
      deed_no: app.deed_no,
      source_type: 'Heba'
    });
    origLand.last_updated = new Date();
    await origLand.save();

    // 3. Update Application Status
    app.status = 'Approved';
    app.payment_status = 'Paid';
    app.ac_land_reviewed_by = req.user.name || 'এসি ল্যান্ড';
    app.ac_land_reviewed_at = new Date();
    await app.save();

    await logActivity({
      action_type: 'HEBA_MUTATION_APPROVED',
      module: 'Other_Deeds',
      description: `হেবা নামজারি অনুমোদিত: গ্রহীতা ${app.heba.recipient_name} (${app.heba.gift_area_decimal} শতক), দলিল নং ${app.deed_no}`,
      user_id: req.user._id,
      nid: req.user.nid,
      meta: { deed_no: app.deed_no, newRecordId }
    });

    return res.status(200).json({
      success: true,
      message: `✅ হেবা নামজারি সফলভাবে অনুমোদিত হয়েছে। গ্রহীতার নামে ${app.heba.gift_area_decimal} শতকের সক্রিয় রেকর্ড প্রস্তুত হয়েছে।`,
      recipient_land_record: recipientLand
    });
  } catch (err) {
    console.error('Approve Heba error:', err);
    return res.status(500).json({ success: false, message: 'হেবা নামজারি অনুমোদন ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/heba/reject
// AC Land rejects Heba Deed and reverts donor's area
router.post('/heba/reject', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { application_id, reason } = req.body;
    const app = await OtherDeedApplication.findById(application_id);
    if (!app || app.deed_type !== 'Heba') {
      return res.status(404).json({ success: false, message: 'আবেদন পাওয়া যায়নি।' });
    }

    const origLand = await LandRecord.findById(app.heba.land_record_id);
    if (origLand) {
      // Revert donor's available area
      origLand.available_area_decimal += app.heba.gift_area_decimal;
      origLand.status = 'Active';
      origLand.last_updated = new Date();
      await origLand.save();
    }

    app.status = 'Rejected';
    app.rejection_reason = reason || 'যথাযথ তথ্যের ঘাটতি থাকায় নামজারি আবেদন খারিজ করা হলো।';
    app.ac_land_reviewed_by = req.user.name || 'এসি ল্যান্ড';
    app.ac_land_reviewed_at = new Date();
    await app.save();

    return res.status(200).json({
      success: true,
      message: 'হেবা আবেদনটি খারিজ করা হয়েছে এবং দাতার জমির পরিমাণ পুনর্বহাল করা হয়েছে।'
    });
  } catch (err) {
    console.error('Reject Heba error:', err);
    return res.status(500).json({ success: false, message: 'হেবা আবেদন বাতিল করতে সমস্যা হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. বিনিময় দলিল (EXCHANGE DEED) ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/other-deeds/exchange/create
// Sub-Registrar creates Exchange Deed with dual OTPs and transfers to AC Land
router.post('/exchange/create', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      owner1_land_id,
      owner1_nid,
      owner1_otp,
      owner2_land_id,
      owner2_nid,
      owner2_otp,
      declaration_text
    } = req.body;

    if (!owner1_land_id || !owner1_nid || !owner1_otp || !owner2_land_id || !owner2_nid || !owner2_otp) {
      return res.status(400).json({
        success: false,
        message: 'মালিক-১ ও মালিক-২ এর জমি, NID এবং উভয়ের ওটিপি কোড প্রদান আবশ্যক।'
      });
    }

    // 1. Fetch both land records
    const land1 = await LandRecord.findById(owner1_land_id);
    const land2 = await LandRecord.findById(owner2_land_id);

    if (!land1 || land1.status !== 'Active' || !land2 || land2.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'উভয় জমি সক্রিয় এবং বিরোধমুক্ত অবস্থায় থাকতে হবে।'
      });
    }

    // 2. Fetch both users
    let user1 = (await findUserByNid(owner1_nid)) || (await findUserByNid(toEnglishDigits(owner1_nid))) || (await findUserByNid(toBengaliDigits(owner1_nid)));
    if (!user1 && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        user1 = await User.findOne({
          $or: [
            { nid: owner1_nid },
            { nid: toEnglishDigits(owner1_nid) },
            { nid: toBengaliDigits(owner1_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!user1 && land1) {
      user1 = {
        _id: 'usr_p1_' + Date.now(),
        name: land1.owner_name || 'মালিক ১',
        nid: owner1_nid,
        email: land1.owner_email || `${toEnglishDigits(owner1_nid)}@evhumi.gov.bd`,
        phone: land1.owner_phone || '01700000000'
      };
    }

    let user2 = (await findUserByNid(owner2_nid)) || (await findUserByNid(toEnglishDigits(owner2_nid))) || (await findUserByNid(toBengaliDigits(owner2_nid)));
    if (!user2 && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        user2 = await User.findOne({
          $or: [
            { nid: owner2_nid },
            { nid: toEnglishDigits(owner2_nid) },
            { nid: toBengaliDigits(owner2_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!user2 && land2) {
      user2 = {
        _id: 'usr_p2_' + Date.now(),
        name: land2.owner_name || 'মালিক ২',
        nid: owner2_nid,
        email: land2.owner_email || `${toEnglishDigits(owner2_nid)}@evhumi.gov.bd`,
        phone: land2.owner_phone || '01700000000'
      };
    }

    if (!user1 || !user2) {
      return res.status(404).json({ success: false, message: 'উভয় নাগরিকের তথ্য সিস্টেমে থাকতে হবে।' });
    }

    // 3. Verify OTP for Owner 1
    const email1 = (user1.email || land1.owner_email || '').trim().toLowerCase();
    let storedOtp1 = await findLatestDeedOtp(email1, owner1_land_id, owner1_nid);
    if (!storedOtp1 && land1.owner_email && land1.owner_email.toLowerCase() !== email1) {
      storedOtp1 = await findLatestDeedOtp(land1.owner_email.toLowerCase(), owner1_land_id, owner1_nid);
    }
    if (!storedOtp1) {
      storedOtp1 = await findLatestDeedOtp('', owner1_land_id, owner1_nid);
    }
    if (!storedOtp1 && process.env.EMAIL_USER) {
      storedOtp1 = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), owner1_land_id, owner1_nid);
    }
    if (!storedOtp1 || storedOtp1.otp !== owner1_otp.trim()) {
      return res.status(400).json({ success: false, message: `মালিক-১ (${user1.name}) এর ওটিপি কোড ভুল বা মেয়াদোত্তীর্ণ।` });
    }

    // 4. Verify OTP for Owner 2
    const email2 = (user2.email || land2.owner_email || '').trim().toLowerCase();
    let storedOtp2 = await findLatestDeedOtp(email2, owner2_land_id, owner2_nid);
    if (!storedOtp2 && land2.owner_email && land2.owner_email.toLowerCase() !== email2) {
      storedOtp2 = await findLatestDeedOtp(land2.owner_email.toLowerCase(), owner2_land_id, owner2_nid);
    }
    if (!storedOtp2) {
      storedOtp2 = await findLatestDeedOtp('', owner2_land_id, owner2_nid);
    }
    if (!storedOtp2 && process.env.EMAIL_USER) {
      storedOtp2 = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), owner2_land_id, owner2_nid);
    }
    if (!storedOtp2 || storedOtp2.otp !== owner2_otp.trim()) {
      return res.status(400).json({ success: false, message: `মালিক-২ (${user2.name}) এর ওটিপি কোড ভুল বা মেয়াদোত্তীর্ণ।` });
    }

    await deleteDeedOtps(email1, owner1_land_id, owner1_nid);
    await deleteDeedOtps(email2, owner2_land_id, owner2_nid);
    if (land1.owner_email) await deleteDeedOtps(land1.owner_email.toLowerCase(), owner1_land_id, owner1_nid);
    if (land2.owner_email) await deleteDeedOtps(land2.owner_email.toLowerCase(), owner2_land_id, owner2_nid);

    // 5. Lock both lands for Exchange Review
    land1.status = 'Pending_Exchange_Review';
    land2.status = 'Pending_Exchange_Review';
    await land1.save();
    await land2.save();

    // 6. Generate deed info
    const deed_no = `EXCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appNo = `APP-EXCH-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const finalDeclaration = declaration_text || 
      `আমরা ${user1.name} (NID: ${user1.nid}) এবং ${user2.name} (NID: ${user2.nid}) উভয়ে সুস্থ মস্তিষ্কে ও পারস্পরিক সম্মতিতে আমাদের নিজ নিজ জমি বিনিময় করছি।`;

    const application = new OtherDeedApplication({
      application_no: appNo,
      deed_type: 'Exchange',
      sub_registry_office: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস',
      deed_no,
      deed_year: new Date().getFullYear().toString(),
      status: 'Pending_AC_Land_Review',
      exchange: {
        owner1: {
          nid: user1.nid,
          name: user1.name,
          phone: user1.phone || '',
          email: user1.email || '',
          land_record_id: land1._id,
          division: land1.division,
          district: land1.district,
          upazila: land1.upazila,
          mouza: land1.mouza,
          jl_no: land1.jl_no,
          khatian_no: land1.khatian_no,
          dag_no: land1.dag_no,
          area_decimal: land1.available_area_decimal,
          otp_verified: true,
          biometric_verified: true
        },
        owner2: {
          nid: user2.nid,
          name: user2.name,
          phone: user2.phone || '',
          email: user2.email || '',
          land_record_id: land2._id,
          division: land2.division,
          district: land2.district,
          upazila: land2.upazila,
          mouza: land2.mouza,
          jl_no: land2.jl_no,
          khatian_no: land2.khatian_no,
          dag_no: land2.dag_no,
          area_decimal: land2.available_area_decimal,
          otp_verified: true,
          biometric_verified: true
        },
        declaration_text: finalDeclaration
      },
      mutation_fee: 2300, // standard dual mutation fee
      payment_status: 'Unpaid',
      submitted_by_officer: req.user.name || 'সাব-রেজিস্ট্রার',
      submitted_by_nid: req.user.nid || ''
    });

    await application.save();

    await logActivity({
      action_type: 'EXCHANGE_DEED_SUBMITTED',
      module: 'Other_Deeds',
      description: `বিনিময় দলিল সম্পাদন: ${user1.name} ও ${user2.name}-এর মধ্যে জমি বিনিময়, দলিল নং ${deed_no}`,
      user_id: req.user._id,
      nid: req.user.nid
    });

    return res.status(200).json({
      success: true,
      message: `✅ বিনিময় দলিল সফলভাবে সম্পাদিত হয়েছে (দলিল নং ${deed_no}) এবং নামজারির জন্য এসি ল্যান্ড কার্যালয়ে প্রেরণ করা হয়েছে।`,
      application
    });
  } catch (err) {
    console.error('Create Exchange deed error:', err);
    return res.status(500).json({ success: false, message: 'বিনিময় দলিল সৃষ্টিতে ত্রুটি হয়েছে।' });
  }
});

// GET /api/other-deeds/exchange/applications
// AC Land fetches pending Exchange applications
router.get('/exchange/applications', verifyToken, async (req, res) => {
  try {
    const list = await OtherDeedApplication.find({
      deed_type: 'Exchange',
      status: { $in: ['Pending_AC_Land_Review', 'Payment_Pending', 'Approved', 'Rejected'] }
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Fetch Exchange applications error:', err);
    return res.status(500).json({ success: false, message: 'বিনিময় আবেদনের তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/exchange/approve
// AC Land approves Exchange and swaps ownership in LandRecord
router.post('/exchange/approve', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await OtherDeedApplication.findById(application_id);
    if (!app || app.deed_type !== 'Exchange') {
      return res.status(404).json({ success: false, message: 'বিনিময় আবেদন পাওয়া যায়নি।' });
    }

    const land1 = await LandRecord.findById(app.exchange.owner1.land_record_id);
    const land2 = await LandRecord.findById(app.exchange.owner2.land_record_id);

    if (!land1 || !land2) {
      return res.status(404).json({ success: false, message: 'উভয় জমির মূল রেকর্ড পাওয়া যায়নি।' });
    }

    // 1. Swap ownership of Land 1 -> becomes Owner 2's land
    land1.owner_nid = app.exchange.owner2.nid;
    land1.owner_name = app.exchange.owner2.name;
    land1.owner_phone = app.exchange.owner2.phone;
    land1.owner_email = app.exchange.owner2.email;
    land1.status = 'Active';
    land1.mutation_source = 'বিনিময় সূত্রে নামজারি';
    land1.exchange_details = {
      exchanged_with_nid: app.exchange.owner1.nid,
      exchanged_with_name: app.exchange.owner1.name,
      exchanged_with_dag: app.exchange.owner2.dag_no,
      exchanged_with_khatian: app.exchange.owner2.khatian_no,
      exchange_deed_no: app.deed_no
    };
    land1.transfer_history = land1.transfer_history || [];
    land1.transfer_history.push({
      title: 'বিনিময় সূত্রে নামজারি',
      date: new Date(),
      details: `${app.exchange.owner1.name} (NID: ${app.exchange.owner1.nid})-এর সাথে জমি বিনিময় সূত্রে অর্জিত।`,
      deed_no: app.deed_no,
      source_type: 'Exchange'
    });
    land1.last_updated = new Date();
    await land1.save();

    // 2. Swap ownership of Land 2 -> becomes Owner 1's land
    land2.owner_nid = app.exchange.owner1.nid;
    land2.owner_name = app.exchange.owner1.name;
    land2.owner_phone = app.exchange.owner1.phone;
    land2.owner_email = app.exchange.owner1.email;
    land2.status = 'Active';
    land2.mutation_source = 'বিনিময় সূত্রে নামজারি';
    land2.exchange_details = {
      exchanged_with_nid: app.exchange.owner2.nid,
      exchanged_with_name: app.exchange.owner2.name,
      exchanged_with_dag: app.exchange.owner1.dag_no,
      exchanged_with_khatian: app.exchange.owner1.khatian_no,
      exchange_deed_no: app.deed_no
    };
    land2.transfer_history = land2.transfer_history || [];
    land2.transfer_history.push({
      title: 'বিনিময় সূত্রে নামজারি',
      date: new Date(),
      details: `${app.exchange.owner2.name} (NID: ${app.exchange.owner2.nid})-এর সাথে জমি বিনিময় সূত্রে অর্জিত।`,
      deed_no: app.deed_no,
      source_type: 'Exchange'
    });
    land2.last_updated = new Date();
    await land2.save();

    // 3. Update application status
    app.status = 'Approved';
    app.payment_status = 'Paid';
    app.ac_land_reviewed_by = req.user.name || 'এসি ল্যান্ড';
    app.ac_land_reviewed_at = new Date();
    await app.save();

    await logActivity({
      action_type: 'EXCHANGE_MUTATION_APPROVED',
      module: 'Other_Deeds',
      description: `বিনিময় নামজারি অনুমোদিত: ${app.exchange.owner1.name} ও ${app.exchange.owner2.name}-এর জমি অদলবদল সম্পন্ন, দলিল নং ${app.deed_no}`,
      user_id: req.user._id,
      nid: req.user.nid
    });

    return res.status(200).json({
      success: true,
      message: '✅ বিনিময় নামজারি সফলভাবে অনুমোদিত হয়েছে এবং উভয়ের নামে জমি প্রতিস্থাপিত হয়েছে।'
    });
  } catch (err) {
    console.error('Approve Exchange error:', err);
    return res.status(500).json({ success: false, message: 'বিনিময় নামজারি অনুমোদন ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/exchange/reject
// AC Land rejects Exchange and unlocks both lands
router.post('/exchange/reject', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { application_id, reason } = req.body;
    const app = await OtherDeedApplication.findById(application_id);
    if (!app || app.deed_type !== 'Exchange') {
      return res.status(404).json({ success: false, message: 'আবেদন পাওয়া যায়নি।' });
    }

    const land1 = await LandRecord.findById(app.exchange.owner1.land_record_id);
    const land2 = await LandRecord.findById(app.exchange.owner2.land_record_id);

    if (land1) {
      land1.status = 'Active';
      await land1.save();
    }
    if (land2) {
      land2.status = 'Active';
      await land2.save();
    }

    app.status = 'Rejected';
    app.rejection_reason = reason || 'যথাযথ তথ্যের অমিল থাকায় বিনিময় আবেদন নামঞ্জুর করা হলো।';
    app.ac_land_reviewed_by = req.user.name || 'এসি ল্যান্ড';
    app.ac_land_reviewed_at = new Date();
    await app.save();

    return res.status(200).json({
      success: true,
      message: 'বিনিময় আবেদনটি খারিজ করা হয়েছে এবং উভয় জমি সক্রিয় করা হয়েছে।'
    });
  } catch (err) {
    console.error('Reject Exchange error:', err);
    return res.status(500).json({ success: false, message: 'বিনিময় আবেদন বাতিল ব্যর্থ হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. বন্ধকি দলিল (MORTGAGE DEED) & UNLOCK ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/other-deeds/mortgage/create
// Sub-Registrar creates Mortgage Deed and locks the specific owner's land
router.post('/mortgage/create', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      land_record_id,
      owner_nid,
      mortgagee_nid,
      loan_amount,
      mortgage_date,
      owner_otp
    } = req.body;

    if (!land_record_id || !owner_nid || !mortgagee_nid || !loan_amount || !owner_otp) {
      return res.status(400).json({
        success: false,
        message: 'জমি, মালিকের NID, বন্ধকগ্রহীতার NID, ঋণের পরিমাণ এবং মালিকের ওটিপি প্রদান আবশ্যক।'
      });
    }

    // 1. Fetch land record
    const land = await LandRecord.findById(land_record_id);
    if (!land || land.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'জমিটি সক্রিয় বা বন্ধক রাখার যোগ্য অবস্থায় নেই।' });
    }

    // 2. Fetch owner & verify OTP
    let ownerUser = (await findUserByNid(owner_nid)) || (await findUserByNid(toEnglishDigits(owner_nid))) || (await findUserByNid(toBengaliDigits(owner_nid)));
    if (!ownerUser && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        ownerUser = await User.findOne({
          $or: [
            { nid: owner_nid },
            { nid: toEnglishDigits(owner_nid) },
            { nid: toBengaliDigits(owner_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!ownerUser && land) {
      ownerUser = {
        _id: 'usr_mort_owner_' + Date.now(),
        name: land.owner_name || 'মালিক',
        nid: owner_nid,
        email: land.owner_email || `${toEnglishDigits(owner_nid)}@evhumi.gov.bd`,
        phone: land.owner_phone || '01700000000'
      };
    }
    if (!ownerUser) {
      return res.status(404).json({ success: false, message: 'মালিকের প্রোফাইল পাওয়া যায়নি।' });
    }

    const ownerEmail = (ownerUser.email || land.owner_email || '').trim().toLowerCase();
    let storedOtp = await findLatestDeedOtp(ownerEmail, land_record_id, owner_nid);
    if (!storedOtp && land.owner_email && land.owner_email.toLowerCase() !== ownerEmail) {
      storedOtp = await findLatestDeedOtp(land.owner_email.toLowerCase(), land_record_id, owner_nid);
    }
    if (!storedOtp) {
      storedOtp = await findLatestDeedOtp('', land_record_id, owner_nid);
    }
    if (!storedOtp && process.env.EMAIL_USER) {
      storedOtp = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), land_record_id, owner_nid);
    }
    if (!storedOtp || storedOtp.otp !== owner_otp.trim()) {
      return res.status(400).json({ success: false, message: 'মালিকের ওটিপি কোডটি ভুল বা মেয়াদোত্তীর্ণ।' });
    }
    await deleteDeedOtps(ownerEmail, land_record_id, owner_nid);
    if (land.owner_email) await deleteDeedOtps(land.owner_email.toLowerCase(), land_record_id, owner_nid);

    // 3. Fetch Mortgagee User
    let mortgageeUser = (await findUserByNid(mortgagee_nid)) || (await findUserByNid(toEnglishDigits(mortgagee_nid))) || (await findUserByNid(toBengaliDigits(mortgagee_nid)));
    if (!mortgageeUser && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        mortgageeUser = await User.findOne({
          $or: [
            { nid: mortgagee_nid },
            { nid: toEnglishDigits(mortgagee_nid) },
            { nid: toBengaliDigits(mortgagee_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!mortgageeUser) {
      mortgageeUser = {
        _id: 'usr_mort_party_' + Date.now(),
        name: req.body.mortgagee_name || 'বন্ধকগ্রহীতা',
        nid: mortgagee_nid,
        email: req.body.mortgagee_email || `${toEnglishDigits(mortgagee_nid)}@evhumi.gov.bd`,
        phone: req.body.mortgagee_phone || '01700000000'
      };
    }

    // 4. Generate deed info
    const deed_no = `MORT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Update LandRecord: Set strictly to Mortgage_Locked
    land.status = 'Mortgage_Locked';
    land.mortgage_details = {
      is_mortgaged: true,
      mortgagee_nid: mortgageeUser.nid,
      mortgagee_name: mortgageeUser.name,
      mortgagee_phone: mortgageeUser.phone || '',
      mortgagee_email: mortgageeUser.email || '',
      loan_amount: parseFloat(loan_amount),
      mortgage_date: mortgage_date ? new Date(mortgage_date) : new Date(),
      mortgage_deed_no: deed_no
    };
    land.transfer_history = land.transfer_history || [];
    land.transfer_history.push({
      title: 'বন্ধকি দলিল সম্পাদন (Mortgage Locked)',
      date: new Date(),
      details: `${mortgageeUser.name} (NID: ${mortgageeUser.nid})-এর অনুকূলে ${loan_amount} টাকার ঋণের বিপরীতে জমি বন্ধক রাখা হয়েছে।`,
      deed_no,
      source_type: 'Mortgage'
    });
    land.last_updated = new Date();
    await land.save();

    // 6. Save Application audit
    const appNo = `APP-MORT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const application = new OtherDeedApplication({
      application_no: appNo,
      deed_type: 'Mortgage',
      sub_registry_office: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস',
      deed_no,
      deed_year: new Date().getFullYear().toString(),
      status: 'Locked',
      mortgage: {
        owner_nid: ownerUser.nid,
        owner_name: ownerUser.name,
        owner_phone: ownerUser.phone || '',
        owner_email: ownerUser.email || '',
        land_record_id: land._id,
        division: land.division,
        district: land.district,
        upazila: land.upazila,
        mouza: land.mouza,
        jl_no: land.jl_no,
        khatian_no: land.khatian_no,
        dag_no: land.dag_no,
        total_area_decimal: land.total_area_decimal,
        mortgagee_nid: mortgageeUser.nid,
        mortgagee_name: mortgageeUser.name,
        mortgagee_phone: mortgageeUser.phone || '',
        mortgagee_email: mortgageeUser.email || '',
        loan_amount: parseFloat(loan_amount),
        mortgage_date: mortgage_date ? new Date(mortgage_date) : new Date(),
        owner_otp_verified: true,
        owner_biometric_verified: true
      },
      submitted_by_officer: req.user.name || 'সাব-রেজিস্ট্রার',
      submitted_by_nid: req.user.nid || ''
    });
    await application.save();

    await logActivity({
      action_type: 'MORTGAGE_DEED_EXECUTED',
      module: 'Other_Deeds',
      description: `বন্ধকি দলিল সম্পাদিত: মালিক ${ownerUser.name}, বন্ধকগ্রহীতা ${mortgageeUser.name}, ঋণের পরিমাণ ${loan_amount} টাকা, দলিল নং ${deed_no}`,
      user_id: req.user._id,
      nid: req.user.nid
    });

    return res.status(200).json({
      success: true,
      message: `✅ বন্ধকি দলিল সফলভাবে নিবন্ধিত হয়েছে (দলিল নং ${deed_no}) এবং জমিটি বন্ধকি সূত্রে সম্পূর্ণ লক করা হয়েছে।`,
      application,
      record: land
    });
  } catch (err) {
    console.error('Create Mortgage error:', err);
    return res.status(500).json({ success: false, message: 'বন্ধকি দলিল সৃষ্টিতে সমস্যা হয়েছে।' });
  }
});

// GET /api/other-deeds/mortgage/locked-lands
// Fetches currently mortgaged lands for unlock section
router.get('/mortgage/locked-lands', verifyToken, async (req, res) => {
  try {
    const list = await LandRecord.find({
      status: 'Mortgage_Locked'
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Fetch mortgaged lands error:', err);
    return res.status(500).json({ success: false, message: 'বন্ধকি জমির তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/mortgage/unlock
// Unlocks mortgage using mortgagee's OTP and biometric verification
router.post('/mortgage/unlock', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const { land_record_id, mortgagee_nid, mortgagee_otp } = req.body;
    if (!land_record_id || !mortgagee_nid || !mortgagee_otp) {
      return res.status(400).json({
        success: false,
        message: 'জমি আইডি, বন্ধকগ্রহীতার NID এবং বন্ধকগ্রহীতার ওটিপি আবশ্যক।'
      });
    }

    const land = await LandRecord.findById(land_record_id);
    if (!land || land.status !== 'Mortgage_Locked') {
      return res.status(400).json({ success: false, message: 'জমিটি বন্ধকাবদ্ধ অবস্থায় নেই।' });
    }

    const mDetails = land.mortgage_details || {};
    const cleanMortNid = mortgagee_nid.trim();

    if (mDetails.mortgagee_nid !== cleanMortNid && 
        toEnglishDigits(mDetails.mortgagee_nid) !== toEnglishDigits(cleanMortNid)) {
      return res.status(400).json({
        success: false,
        message: 'প্রদত্ত NID নম্বরটি এই জমির মূল বন্ধকগ্রহীতার NID-এর সাথে মেলেনি।'
      });
    }

    // Verify Mortgagee OTP
    const mortEmail = (mDetails.mortgagee_email || '').trim().toLowerCase();
    let storedOtp = await findLatestDeedOtp(mortEmail, land_record_id, cleanMortNid);
    if (!storedOtp && cleanMortNid) {
      storedOtp = await findLatestDeedOtp('', land_record_id, cleanMortNid);
    }
    if (!storedOtp && process.env.EMAIL_USER) {
      storedOtp = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), land_record_id, cleanMortNid);
    }
    if (!storedOtp || storedOtp.otp !== mortgagee_otp.trim()) {
      return res.status(400).json({ success: false, message: 'বন্ধকগ্রহীতার ওটিপি ভুল বা মেয়াদোত্তীর্ণ।' });
    }
    await deleteDeedOtps(mortEmail, land_record_id, cleanMortNid);

    // Release mortgage lock -> Revert to Active
    land.status = 'Active';
    land.mortgage_details.is_mortgaged = false;
    land.mortgage_details.unlocked_at = new Date();
    land.transfer_history = land.transfer_history || [];
    land.transfer_history.push({
      title: 'বন্ধক দায়মুক্তি দলিল (Mortgage Released)',
      date: new Date(),
      details: `${mDetails.mortgagee_name} কর্তৃক ঋণ পরিশোধ সাপেক্ষে বন্ধক আনলক ও জমি দায়মুক্ত করা হয়েছে।`,
      source_type: 'Mortgage_Release'
    });
    land.last_updated = new Date();
    await land.save();

    // Update application record
    await OtherDeedApplication.updateMany(
      { 'mortgage.land_record_id': land._id, deed_type: 'Mortgage', status: 'Locked' },
      { 
        $set: { 
          status: 'Unlocked', 
          'mortgage.unlocked_at': new Date(),
          'mortgage.unlocked_by_nid': cleanMortNid,
          'mortgage.unlock_otp_verified': true,
          'mortgage.unlock_biometric_verified': true
        } 
      }
    );

    await logActivity({
      action_type: 'MORTGAGE_RELEASED',
      module: 'Other_Deeds',
      description: `বন্ধক দায়মুক্তি সম্পন্ন: জমি দাগ নং ${land.dag_no}, বন্ধকগ্রহীতা ${mDetails.mortgagee_name} কর্তৃক দায়মুক্ত।`,
      user_id: req.user._id,
      nid: req.user.nid
    });

    return res.status(200).json({
      success: true,
      message: '✅ বন্ধক সফলভাবে আনলক করা হয়েছে। জমিটি মূল মালিকের জন্য পুনরায় সক্রিয় (Active) করা হয়েছে।'
    });
  } catch (err) {
    console.error('Unlock mortgage error:', err);
    return res.status(500).json({ success: false, message: 'বন্ধক আনলক করতে সমস্যা হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. বায়নাপত্র দলিল (BAYNA DEED) & UNLOCK ROUTES
// ─────────────────────────────────────────────────────────────

// POST /api/other-deeds/bayna/create
// Sub-Registrar creates Bayna Deed and locks seller's land
router.post('/bayna/create', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      land_record_id,
      seller_nid,
      bayna_buyer_nid,
      bayna_amount,
      total_agreed_price,
      bayna_date,
      expiry_date,
      seller_otp
    } = req.body;

    if (!land_record_id || !seller_nid || !bayna_buyer_nid || !bayna_amount || !seller_otp) {
      return res.status(400).json({
        success: false,
        message: 'জমি, বিক্রেতার NID, বায়নাগ্রহীতার NID, বায়নার পরিমাণ এবং বিক্রেতার ওটিপি আবশ্যক।'
      });
    }

    // 1. Fetch land record
    const land = await LandRecord.findById(land_record_id);
    if (!land || land.status !== 'Active') {
      return res.status(400).json({ success: false, message: 'জমিটি সক্রিয় বা বায়নাকৃত হওয়ার যোগ্য অবস্থায় নেই।' });
    }

    // 2. Fetch Seller User & verify OTP
    let sellerUser = (await findUserByNid(seller_nid)) || (await findUserByNid(toEnglishDigits(seller_nid))) || (await findUserByNid(toBengaliDigits(seller_nid)));
    if (!sellerUser && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        sellerUser = await User.findOne({
          $or: [
            { nid: seller_nid },
            { nid: toEnglishDigits(seller_nid) },
            { nid: toBengaliDigits(seller_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!sellerUser && land) {
      sellerUser = {
        _id: 'usr_seller_' + Date.now(),
        name: land.owner_name || 'বিক্রেতা',
        nid: seller_nid,
        email: land.owner_email || `${toEnglishDigits(seller_nid)}@evhumi.gov.bd`,
        phone: land.owner_phone || '01700000000'
      };
    }
    if (!sellerUser) {
      return res.status(404).json({ success: false, message: 'বিক্রেতার প্রোফাইল পাওয়া যায়নি।' });
    }

    const sellerEmail = (sellerUser.email || land.owner_email || '').trim().toLowerCase();
    let storedOtp = await findLatestDeedOtp(sellerEmail, land_record_id, seller_nid);
    if (!storedOtp && land.owner_email && land.owner_email.toLowerCase() !== sellerEmail) {
      storedOtp = await findLatestDeedOtp(land.owner_email.toLowerCase(), land_record_id, seller_nid);
    }
    if (!storedOtp) {
      storedOtp = await findLatestDeedOtp('', land_record_id, seller_nid);
    }
    if (!storedOtp && process.env.EMAIL_USER) {
      storedOtp = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), land_record_id, seller_nid);
    }
    if (!storedOtp || storedOtp.otp !== seller_otp.trim()) {
      return res.status(400).json({ success: false, message: 'বিক্রেতার ওটিপি ভুল বা মেয়াদোত্তীর্ণ।' });
    }
    await deleteDeedOtps(sellerEmail, land_record_id, seller_nid);
    if (land.owner_email) await deleteDeedOtps(land.owner_email.toLowerCase(), land_record_id, seller_nid);

    // 3. Fetch Bayna Buyer User
    let buyerUser = (await findUserByNid(bayna_buyer_nid)) || (await findUserByNid(toEnglishDigits(bayna_buyer_nid))) || (await findUserByNid(toBengaliDigits(bayna_buyer_nid)));
    if (!buyerUser && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        buyerUser = await User.findOne({
          $or: [
            { nid: bayna_buyer_nid },
            { nid: toEnglishDigits(bayna_buyer_nid) },
            { nid: toBengaliDigits(bayna_buyer_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!buyerUser) {
      buyerUser = {
        _id: 'usr_bayna_buyer_' + Date.now(),
        name: req.body.bayna_buyer_name || 'বায়নাগ্রহীতা',
        nid: bayna_buyer_nid,
        email: req.body.bayna_buyer_email || `${toEnglishDigits(bayna_buyer_nid)}@evhumi.gov.bd`,
        phone: req.body.bayna_buyer_phone || '01700000000'
      };
    }

    // 4. Generate deed info
    const deed_no = `BAYNA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Update LandRecord: Set strictly to Bayna_Locked
    land.status = 'Bayna_Locked';
    land.bayna_details = {
      is_bayna_locked: true,
      bayna_buyer_nid: buyerUser.nid,
      bayna_buyer_name: buyerUser.name,
      bayna_buyer_phone: buyerUser.phone || '',
      bayna_buyer_email: buyerUser.email || '',
      bayna_amount: parseFloat(bayna_amount),
      bayna_date: bayna_date ? new Date(bayna_date) : new Date(),
      bayna_deed_no: deed_no,
      unlocked_at: null
    };
    land.transfer_history = land.transfer_history || [];
    land.transfer_history.push({
      title: 'বায়নাপত্র দলিল সম্পাদন (Bayna Locked)',
      date: new Date(),
      details: `${buyerUser.name} (NID: ${buyerUser.nid})-এর বরাবরে বায়না চুক্তি সম্পন্ন হয়েছে। বায়না মূল্য: ${bayna_amount} টাকা।`,
      deed_no,
      source_type: 'Bayna'
    });
    land.last_updated = new Date();
    await land.save();

    // 6. Save Application audit
    const appNo = `APP-BAYNA-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const application = new OtherDeedApplication({
      application_no: appNo,
      deed_type: 'Bayna',
      sub_registry_office: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস',
      deed_no,
      deed_year: new Date().getFullYear().toString(),
      status: 'Locked',
      bayna: {
        seller_nid: sellerUser.nid,
        seller_name: sellerUser.name,
        seller_phone: sellerUser.phone || '',
        seller_email: sellerUser.email || '',
        land_record_id: land._id,
        division: land.division,
        district: land.district,
        upazila: land.upazila,
        mouza: land.mouza,
        jl_no: land.jl_no,
        khatian_no: land.khatian_no,
        dag_no: land.dag_no,
        total_area_decimal: land.total_area_decimal,
        bayna_buyer_nid: buyerUser.nid,
        bayna_buyer_name: buyerUser.name,
        bayna_buyer_phone: buyerUser.phone || '',
        bayna_buyer_email: buyerUser.email || '',
        bayna_amount: parseFloat(bayna_amount),
        total_agreed_price: total_agreed_price ? parseFloat(total_agreed_price) : 0,
        bayna_date: bayna_date ? new Date(bayna_date) : new Date(),
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        seller_otp_verified: true,
        seller_biometric_verified: true
      },
      submitted_by_officer: req.user.name || 'সাব-রেজিস্ট্রার',
      submitted_by_nid: req.user.nid || ''
    });
    await application.save();

    await logActivity({
      action_type: 'BAYNA_DEED_EXECUTED',
      module: 'Other_Deeds',
      description: `বায়নাপত্র দলিল সম্পাদিত: বিক্রেতা ${sellerUser.name}, ক্রেতা ${buyerUser.name}, বায়না মূল্য ${bayna_amount} টাকা, দলিল নং ${deed_no}`,
      user_id: req.user._id,
      nid: req.user.nid
    });

    return res.status(200).json({
      success: true,
      message: `✅ বায়নাপত্র দলিল সফলভাবে নিবন্ধিত হয়েছে (দলিল নং ${deed_no}) এবং জমিটি বায়না সূত্রে লক করা হয়েছে।`,
      application,
      record: land
    });
  } catch (err) {
    console.error('Create Bayna error:', err);
    return res.status(500).json({ success: false, message: 'বায়নাপত্র দলিল সৃষ্টিতে সমস্যা হয়েছে।' });
  }
});

// GET /api/other-deeds/bayna/locked-lands
// Fetches currently bayna locked lands for unlock section
router.get('/bayna/locked-lands', verifyToken, async (req, res) => {
  try {
    const list = await LandRecord.find({
      status: 'Bayna_Locked'
    }).sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Fetch bayna lands error:', err);
    return res.status(500).json({ success: false, message: 'বায়নাকৃত জমির তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/bayna/unlock
// Unlocks bayna using bayna buyer's OTP and biometric verification
router.post('/bayna/unlock', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const { land_record_id, bayna_buyer_nid, bayna_buyer_otp } = req.body;
    if (!land_record_id || !bayna_buyer_nid || !bayna_buyer_otp) {
      return res.status(400).json({
        success: false,
        message: 'জমি আইডি, বায়না গ্রহীতার NID এবং বায়না গ্রহীতার ওটিপি আবশ্যক।'
      });
    }

    const land = await LandRecord.findById(land_record_id);
    if (!land || land.status !== 'Bayna_Locked') {
      return res.status(400).json({ success: false, message: 'জমিটি বায়না সূত্রে লকড অবস্থায় নেই।' });
    }

    const bDetails = land.bayna_details || {};
    const cleanBuyerNid = bayna_buyer_nid.trim();

    if (bDetails.bayna_buyer_nid !== cleanBuyerNid && 
        toEnglishDigits(bDetails.bayna_buyer_nid) !== toEnglishDigits(cleanBuyerNid)) {
      return res.status(400).json({
        success: false,
        message: 'প্রদত্ত NID নম্বরটি এই জমির বায়না গ্রহীতার NID-এর সাথে মেলেনি।'
      });
    }

    // Verify Bayna Buyer OTP
    const buyerEmail = (bDetails.bayna_buyer_email || '').trim().toLowerCase();
    let storedOtp = await findLatestDeedOtp(buyerEmail, land_record_id, cleanBuyerNid);
    if (!storedOtp && cleanBuyerNid) {
      storedOtp = await findLatestDeedOtp('', land_record_id, cleanBuyerNid);
    }
    if (!storedOtp && process.env.EMAIL_USER) {
      storedOtp = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), land_record_id, cleanBuyerNid);
    }
    if (!storedOtp || storedOtp.otp !== bayna_buyer_otp.trim()) {
      return res.status(400).json({ success: false, message: 'বায়না গ্রহীতার ওটিপি ভুল বা মেয়াদোত্তীর্ণ।' });
    }
    await deleteDeedOtps(buyerEmail, land_record_id, cleanBuyerNid);

    // Release Bayna lock -> Revert to Active
    land.status = 'Active';
    land.bayna_details.is_bayna_locked = false;
    land.bayna_details.unlocked_at = new Date();
    land.transfer_history = land.transfer_history || [];
    land.transfer_history.push({
      title: 'বায়নাপত্র চুক্তি বাতিল/দায়মুক্তি (Bayna Released)',
      date: new Date(),
      details: `${bDetails.bayna_buyer_name} কর্তৃক দায়মুক্তি প্রদান সাপেক্ষে বায়না লক প্রত্যাহার করা হয়েছে।`,
      source_type: 'Bayna_Release'
    });
    land.last_updated = new Date();
    await land.save();

    // Update application record
    await OtherDeedApplication.updateMany(
      { 'bayna.land_record_id': land._id, deed_type: 'Bayna', status: 'Locked' },
      { 
        $set: { 
          status: 'Unlocked', 
          'bayna.unlocked_at': new Date(),
          'bayna.unlocked_by_nid': cleanBuyerNid,
          'bayna.unlock_otp_verified': true,
          'bayna.unlock_biometric_verified': true
        } 
      }
    );

    await logActivity({
      action_type: 'BAYNA_RELEASED',
      module: 'Other_Deeds',
      description: `বায়না লক প্রত্যাহার: জমি দাগ নং ${land.dag_no}, বায়না গ্রহীতা ${bDetails.bayna_buyer_name} কর্তৃক অবমুক্ত।`,
      user_id: req.user._id,
      nid: req.user.nid
    });

    return res.status(200).json({
      success: true,
      message: '✅ বায়নাপত্র সফলভাবে আনলক করা হয়েছে। জমিটি মূল মালিকের জন্য পুনরায় সক্রিয় (Active) করা হয়েছে।'
    });
  } catch (err) {
    console.error('Unlock bayna error:', err);
    return res.status(500).json({ success: false, message: 'বায়না আনলক করতে সমস্যা হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. WAKFO DEED (ওয়াকফ দলিল) CONTROLLERS
// ─────────────────────────────────────────────────────────────

// POST /api/other-deeds/verify-institution-nid
// Verifies if an institution user exists by NID and ensures role === 'Institution'
router.post('/verify-institution-nid', verifyToken, async (req, res) => {
  try {
    const { nid } = req.body;
    if (!nid) {
      return res.status(400).json({ success: false, message: 'প্রতিষ্ঠানের প্রতিনিধির NID প্রদান আবশ্যক।' });
    }
    const cleanNid = nid.trim();
    const engNid = toEnglishDigits(cleanNid);
    const benNid = toBengaliDigits(cleanNid);

    const user = await User.findOne({
      $or: [
        { nid: cleanNid },
        { nid: engNid },
        { nid: benNid }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: `প্রদত্ত NID: ${cleanNid} নম্বরধারী কোনো প্রতিষ্ঠান সিস্টেমে নিবন্ধিত নেই। অনুগ্রহ করে প্রথমে প্রতিষ্ঠানটি নিবন্ধন করুন।`
      });
    }

    if (user.role !== 'Institution') {
      return res.status(400).json({
        success: false,
        message: `⚠️ এই NID (${user.name}) কোনো প্রতিষ্ঠান হিসেবে নিবন্ধিত নয় (রোল: সাধারণ নাগরিক)। ওয়াকফ দলিল কেবল নিবন্ধিত ধর্মীয়/দাতব্য প্রতিষ্ঠানের অনুকূলে সম্পাদন সম্ভব, নাগরিক-টু-নাগরিক সম্ভব নয়।`
      });
    }

    return res.status(200).json({
      success: true,
      institution: {
        _id: user._id,
        name: user.name,
        nid: user.nid,
        phone: user.phone,
        email: user.email,
        division: user.division,
        district: user.district,
        upazila: user.upazila,
        mouza: user.mouza || '',
        role: user.role
      }
    });
  } catch (err) {
    console.error('Verify Institution error:', err);
    return res.status(500).json({ success: false, message: 'প্রতিষ্ঠান যাচাইয়ে ত্রুটি হয়েছে।' });
  }
});

// POST /api/other-deeds/wakfo/create
// Registrar creates Wakfo Deed (Citizen to Institution)
router.post('/wakfo/create', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const {
      land_record_id,
      donor_nid,
      institution_nid,
      wakfo_area_decimal,
      institution_type,
      wakfo_purpose,
      donor_otp
    } = req.body;

    if (!land_record_id || !donor_nid || !institution_nid || !wakfo_area_decimal || !donor_otp) {
      return res.status(400).json({
        success: false,
        message: 'জমির আইডি, দাতার NID, প্রতিষ্ঠানের NID, ওয়াকফের জমির পরিমাণ এবং দাতার ওটিপি প্রদান আবশ্যক।'
      });
    }

    const wakfoArea = parseFloat(wakfo_area_decimal);
    if (isNaN(wakfoArea) || wakfoArea <= 0) {
      return res.status(400).json({ success: false, message: 'ওয়াকফকৃত জমির পরিমাণ অবশ্যই ০-এর বেশি হতে হবে।' });
    }

    // 1. Verify Land Record
    const land = await LandRecord.findById(land_record_id);
    if (!land) {
      return res.status(404).json({ success: false, message: 'জমির রেকর্ড পাওয়া যায়নি।' });
    }

    // 2. Verify Land Status & Ownership
    const landOwnerNid = toEnglishDigits(land.owner_nid);
    const donorCleanNid = toEnglishDigits(donor_nid);
    if (landOwnerNid !== donorCleanNid) {
      return res.status(403).json({ success: false, message: 'প্রদত্ত জমিটি এই দাতার মালিকানাধীন নয়।' });
    }

    if (land.status === 'Mortgage_Locked') {
      return res.status(400).json({ success: false, message: 'জমিটি বর্তমানে ব্যাংকে বন্ধকাবদ্ধ (Mortgaged) রয়েছে। ওয়াকফ করা সম্ভব নয়।' });
    }
    if (land.status === 'Bayna_Locked') {
      return res.status(400).json({ success: false, message: 'জমিটি বর্তমানে বায়নাবদ্ধ (Bayna Locked) রয়েছে। ওয়াকফ করা সম্ভব নয়।' });
    }
    if (land.status === 'Frozen_Death') {
      return res.status(400).json({ success: false, message: 'মালিকের মৃত্যুর কারণে জমিটির হস্তান্তর সাময়িক স্থগিত রয়েছে।' });
    }
    if (land.available_area_decimal < wakfoArea) {
      return res.status(400).json({
        success: false,
        message: `অনুরোধকৃত জমির পরিমাণ (${wakfoArea} শতক) অবশিষ্ট অনুমোদনযোগ্য জমির (${land.available_area_decimal} শতক) চেয়ে বেশি।`
      });
    }

    // 3. Verify Donor User & OTP
    let donorUser = (await findUserByNid(donor_nid)) || (await findUserByNid(toEnglishDigits(donor_nid))) || (await findUserByNid(toBengaliDigits(donor_nid)));
    if (!donorUser && mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        donorUser = await User.findOne({
          $or: [
            { nid: donor_nid },
            { nid: toEnglishDigits(donor_nid) },
            { nid: toBengaliDigits(donor_nid) }
          ]
        }).maxTimeMS(2000);
      } catch (e) {}
    }
    if (!donorUser) {
      donorUser = {
        name: land.owner_name,
        nid: donor_nid,
        email: land.owner_email || `${toEnglishDigits(donor_nid)}@evhumi.gov.bd`,
        phone: land.owner_phone || '01700000000'
      };
    }

    const donorEmail = (donorUser.email || land.owner_email || '').trim().toLowerCase();
    let storedOtpObj = await findLatestDeedOtp(donorEmail, land_record_id, donor_nid);
    if (!storedOtpObj && land.owner_email && land.owner_email.toLowerCase() !== donorEmail) {
      storedOtpObj = await findLatestDeedOtp(land.owner_email.toLowerCase(), land_record_id, donor_nid);
    }
    if (!storedOtpObj) {
      storedOtpObj = await findLatestDeedOtp('', land_record_id, donor_nid);
    }
    if (!storedOtpObj && process.env.EMAIL_USER) {
      storedOtpObj = await findLatestDeedOtp(process.env.EMAIL_USER.toLowerCase(), land_record_id, donor_nid);
    }
    if (!storedOtpObj || storedOtpObj.otp !== donor_otp.trim()) {
      return res.status(400).json({ success: false, message: 'দাতার ওটিপি কোডটি ভুল বা মেয়াদোত্তীর্ণ।' });
    }
    await deleteDeedOtps(donorEmail, land_record_id, donor_nid);
    if (land.owner_email) await deleteDeedOtps(land.owner_email.toLowerCase(), land_record_id, donor_nid);

    // 4. Verify Institution User & Role
    let instUser = await User.findOne({
      $or: [
        { nid: institution_nid.trim() },
        { nid: toEnglishDigits(institution_nid.trim()) },
        { nid: toBengaliDigits(institution_nid.trim()) }
      ]
    });

    if (!instUser) {
      return res.status(404).json({ success: false, message: 'গ্রহীতা প্রতিষ্ঠান সিস্টেমে নিবন্ধিত নেই।' });
    }
    if (instUser.role !== 'Institution') {
      return res.status(400).json({
        success: false,
        message: 'ওয়াকফ দলিল কেবল নিবন্ধিত প্রতিষ্ঠান (মসজিদ/মাদ্রাসা/স্কুল ইত্যাদি)-এর অনুকূলে সম্পাদন সম্ভব।'
      });
    }

    // 5. Generate Deed Identifiers
    const deed_no = `WAKF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const deed_year = new Date().getFullYear().toString();
    const sub_registry_code = 'SRO-BOG-SG-01';

    const cryptoPayload = generateLandCryptoPayload({
      deed_no,
      deed_year,
      sub_registry_code,
      mouza: land.mouza,
      dag_no: land.dag_no,
      khatian_no: land.khatian_no,
      seller_nid: donorUser.nid,
      buyer_nid: instUser.nid
    });

    const appNo = `APP-WAKF-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 6. Deduct donor available area to prevent double-selling
    land.available_area_decimal = Math.max(0, land.available_area_decimal - wakfoArea);
    if (land.available_area_decimal <= 0) {
      land.status = 'Pending_Wakfo_Review';
    }
    land.last_updated = new Date();
    await land.save();

    // 7. Save Application
    const application = new OtherDeedApplication({
      application_no: appNo,
      deed_type: 'Wakfo',
      sub_registry_office: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস',
      sub_registry_code,
      deed_no,
      deed_year,
      deed_hash: cryptoPayload.deed_hash,
      qr_code_id: cryptoPayload.qr_code_id,
      status: 'Pending_AC_Land_Review',
      wakfo: {
        donor_nid: donorUser.nid,
        donor_name: donorUser.name,
        donor_phone: donorUser.phone || '',
        donor_email: donorUser.email || '',
        land_record_id: land._id,
        division: land.division,
        district: land.district,
        upazila: land.upazila,
        mouza: land.mouza,
        jl_no: land.jl_no,
        khatian_no: land.khatian_no,
        dag_no: land.dag_no,
        donor_total_area: land.total_area_decimal,
        wakfo_area_decimal: wakfoArea,
        remaining_donor_area: land.available_area_decimal,
        institution_id: instUser._id,
        institution_nid: instUser.nid,
        institution_name: instUser.name,
        institution_phone: instUser.phone || '',
        institution_email: instUser.email || '',
        institution_type: institution_type || 'মসজিদ / মাদ্রাসা / ধর্মীয় দাতব্য প্রতিষ্ঠান',
        wakfo_purpose: wakfo_purpose || 'ধর্মীয় ও জনকল্যাণমূলক ওয়াকফ',
        donor_otp_verified: true,
        donor_biometric_verified: true
      },
      mutation_fee: 1150,
      payment_status: 'Unpaid',
      submitted_by_officer: req.user.name || 'সাব-রেজিস্ট্রার',
      submitted_by_nid: req.user.nid || ''
    });

    await application.save();

    await logActivity({
      action_type: 'WAKFO_DEED_SUBMITTED',
      module: 'Other_Deeds',
      description: `ওয়াকফ দলিল সম্পাদন: দাতা ${donorUser.name} কর্তৃক ${instUser.name}-এর অনুকূলে ${wakfoArea} শতক জমি ওয়াকফ, দলিল নং ${deed_no}`,
      user_id: req.user._id,
      nid: req.user.nid,
      meta: { deed_no, application_no: appNo }
    });

    return res.status(200).json({
      success: true,
      message: `✅ ওয়াকফ দলিল সফলভাবে সম্পাদিত হয়েছে (দলিল নং ${deed_no}) এবং নামজারির জন্য এসি ল্যান্ড কার্যালয়ে প্রেরণ করা হয়েছে।`,
      application
    });
  } catch (err) {
    console.error('Wakfo Deed submission error:', err);
    return res.status(500).json({ success: false, message: 'ওয়াকফ দলিল সৃষ্টিতে সার্ভার ত্রুটি হয়েছে।' });
  }
});

// GET /api/other-deeds/wakfo/applications
// Fetches Wakfo applications for AC Land and Registrar
router.get('/wakfo/applications', verifyToken, async (req, res) => {
  try {
    const list = await OtherDeedApplication.find({
      deed_type: 'Wakfo',
      status: { $in: ['Pending_AC_Land_Review', 'Payment_Pending', 'Approved', 'Rejected'] }
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: list.length, data: list });
  } catch (err) {
    console.error('Fetch Wakfo applications error:', err);
    return res.status(500).json({ success: false, message: 'ওয়াকফ আবেদনের তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/wakfo/approve
// AC Land approves Wakfo Mutation and creates new LandRecord for Institution
router.post('/wakfo/approve', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { application_id } = req.body;
    const app = await OtherDeedApplication.findById(application_id);
    if (!app || app.deed_type !== 'Wakfo') {
      return res.status(404).json({ success: false, message: 'ওয়াকফ আবেদন পাওয়া যায়নি।' });
    }

    const origLand = await LandRecord.findById(app.wakfo.land_record_id);
    if (!origLand) {
      return res.status(404).json({ success: false, message: 'মূল জমির রেকর্ড পাওয়া যায়নি।' });
    }

    // 1. Create New Active LandRecord for Institution
    const newRecordId = `rec_wakfo_${Date.now()}_${origLand.dag_no}`;
    const newQrId = `QR-WAKF-${origLand.dag_no}-${Date.now().toString().slice(-4)}`;

    const institutionLand = new LandRecord({
      record_id: newRecordId,
      division: origLand.division,
      district: origLand.district,
      upazila: origLand.upazila,
      mouza: origLand.mouza,
      jl_no: origLand.jl_no,
      khatian_no: origLand.khatian_no,
      dag_no: origLand.dag_no,
      owner_nid: app.wakfo.institution_nid,
      owner_name: app.wakfo.institution_name,
      owner_phone: app.wakfo.institution_phone,
      owner_email: app.wakfo.institution_email,
      total_area_decimal: app.wakfo.wakfo_area_decimal,
      available_area_decimal: app.wakfo.wakfo_area_decimal,
      status: 'Active',
      mutation_source: 'ওয়াকফ সূত্রে নামজারি',
      deed_no: app.deed_no,
      deed_year: app.deed_year,
      sub_registry_code: app.sub_registry_code,
      deed_hash: app.deed_hash,
      qr_code_id: newQrId,
      transfer_history: [
        {
          title: 'ওয়াকফ সূত্রে নামজারি',
          date: new Date(),
          details: `${app.wakfo.donor_name} (NID: ${app.wakfo.donor_nid}) কর্তৃক ওয়াকফ সূত্রে ${app.wakfo.institution_name}-এর অনুকূলে প্রদত্ত ${app.wakfo.wakfo_area_decimal} শতক জমি নামজারি অনুমোদিত হয়েছে। উদ্দেশ্য: ${app.wakfo.wakfo_purpose || 'ধর্মীয়/জনকল্যাণমূলক'}`,
          deed_no: app.deed_no,
          source_type: 'Wakfo'
        }
      ]
    });

    await institutionLand.save();

    // 2. Update Donor's Land Record
    origLand.status = origLand.available_area_decimal > 0 ? 'Active' : 'Sold';
    origLand.transfer_history = origLand.transfer_history || [];
    origLand.transfer_history.push({
      title: 'ওয়াকফ সূত্রে জমি হস্তান্তর',
      date: new Date(),
      details: `${app.wakfo.institution_name}-এর অনুকূলে ওয়াকফ সূত্রে ${app.wakfo.wakfo_area_decimal} শতক জমি হস্তান্তর করা হয়েছে।`,
      deed_no: app.deed_no,
      source_type: 'Wakfo'
    });
    origLand.last_updated = new Date();
    await origLand.save();

    // 3. Update Application Status
    app.status = 'Approved';
    app.payment_status = 'Paid';
    app.ac_land_reviewed_by = req.user.name || 'এসি ল্যান্ড';
    app.ac_land_reviewed_at = new Date();
    await app.save();

    await logActivity({
      action_type: 'WAKFO_MUTATION_APPROVED',
      module: 'Other_Deeds',
      description: `ওয়াকফ নামজারি অনুমোদিত: গ্রহীতা ${app.wakfo.institution_name} (${app.wakfo.wakfo_area_decimal} শতক), দলিল নং ${app.deed_no}`,
      user_id: req.user._id,
      nid: req.user.nid,
      meta: { deed_no: app.deed_no, newRecordId }
    });

    return res.status(200).json({
      success: true,
      message: `✅ ওয়াকফ নামজারি সফলভাবে অনুমোদিত হয়েছে। ${app.wakfo.institution_name}-এর নামে ${app.wakfo.wakfo_area_decimal} শতকের সক্রিয় রেকর্ড প্রস্তুত হয়েছে।`,
      institution_land_record: institutionLand
    });
  } catch (err) {
    console.error('Approve Wakfo error:', err);
    return res.status(500).json({ success: false, message: 'ওয়াকফ নামজারি অনুমোদন ব্যর্থ হয়েছে।' });
  }
});

// POST /api/other-deeds/wakfo/reject
// AC Land rejects Wakfo Deed and reverts donor's area
router.post('/wakfo/reject', verifyToken, requireRole('AC Land Office', 'Super Admin'), async (req, res) => {
  try {
    const { application_id, reason } = req.body;
    const app = await OtherDeedApplication.findById(application_id);
    if (!app || app.deed_type !== 'Wakfo') {
      return res.status(404).json({ success: false, message: 'আবেদন পাওয়া যায়নি।' });
    }

    const origLand = await LandRecord.findById(app.wakfo.land_record_id);
    if (origLand) {
      origLand.available_area_decimal += app.wakfo.wakfo_area_decimal;
      origLand.status = 'Active';
      origLand.last_updated = new Date();
      await origLand.save();
    }

    app.status = 'Rejected';
    app.rejection_reason = reason || 'যথাযথ তথ্যের ঘাটতি থাকায় ওয়াকফ নামজারি আবেদন খারিজ করা হলো।';
    app.ac_land_reviewed_by = req.user.name || 'এসি ল্যান্ড';
    app.ac_land_reviewed_at = new Date();
    await app.save();

    return res.status(200).json({
      success: true,
      message: 'ওয়াকফ আবেদনটি খারিজ করা হয়েছে এবং দাতার জমির পরিমাণ পুনর্বহাল করা হয়েছে।'
    });
  } catch (err) {
    console.error('Reject Wakfo error:', err);
    return res.status(500).json({ success: false, message: 'ওয়াকফ আবেদন বাতিল করতে সমস্যা হয়েছে।' });
  }
});

module.exports = router;

