const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { generateLandCryptoPayload } = require('../utils/cryptoEngine');
const LandRecord = require('../models/LandRecord');
const User = require('../models/User');
const { logActivity } = require('../utils/auditLogger');

const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

// GET /api/mouzas - Fetch distinct list of mouzas from LandRecord database
router.get('/mouzas', async (req, res) => {
  try {
    const mouzas = await LandRecord.distinct('mouza');
    const validMouzas = (mouzas || [])
      .filter(m => m && typeof m === 'string' && m.trim().length > 0)
      .map(m => m.trim());

    // Comprehensive list of known pilot/system mouzas
    const defaultMouzas = ['গুজিয়া', 'ধানমন্ডি', 'মিরপুর', 'শিবগঞ্জ', 'চকসারকার', 'মহাস্থান', 'পাইকপাড়া', 'তেজগাঁও', 'উত্তরা'];
    const merged = Array.from(new Set([...validMouzas, ...defaultMouzas]))
      .sort((a, b) => a.localeCompare(b, 'bn'));

    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({ success: true, mouzas: merged });
  } catch (err) {
    console.error('Error fetching mouzas:', err);
    res.status(500).json({ success: false, message: 'মৌজা লোড করতে ব্যর্থ হয়েছে।' });
  }
});

// GET /api/verify-buyer/:nid - Verify buyer exists in database and fetch their profile
router.get('/verify-buyer/:nid', async (req, res) => {
  try {
    const rawNid = (req.params.nid || '').toString().trim();
    if (!rawNid) {
      return res.status(400).json({ success: false, message: 'ক্রেতার NID প্রদান আবশ্যক।' });
    }

    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    const user = await User.findOne({
      $or: [{ nid: rawNid }, { nid: engNid }, { nid: bngNid }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '⚠️ এই NID দিয়ে নিবন্ধিত কোনো ক্রেতার অ্যাকাউন্ট ডাটাবেজে পাওয়া যায়নি। ক্রেতাকে প্রথমে ই-ভূমি পোর্টালে নাগরিক নিবন্ধন সম্পন্ন করতে বলুন।'
      });
    }

    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({
      success: true,
      message: '✅ নিবন্ধিত ক্রেতা সনাক্ত হয়েছে।',
      buyer: {
        name: user.name,
        nid: user.nid,
        phone: user.phone || '',
        email: user.email || '',
        division: user.division || 'ঢাকা',
        district: user.district || 'ঢাকা',
        upazila: user.upazila || 'ধানমন্ডি'
      }
    });
  } catch (err) {
    console.error('Verify buyer error:', err);
    res.status(500).json({ success: false, message: 'সার্ভার ত্রুটি', error: err.message });
  }
});

// POST /api/grant-deed
// P4 End 1: Registry Officer grants deed, generates SHA-256 hash, locks property
// MANDATORY: OTP Verification required for all deed registrations
router.post('/grant-deed', async (req, res) => {
  try {
    const {
      record_id,
      deed_no,
      deed_year,
      sub_registry_code,
      buyer_nid,
      buyer_name,
      buyer_phone,
      buyer_email,
      buyers,
      sold_area,
      otp // Mandatory OTP
    } = req.body;

    const record = await LandRecord.findById(record_id);
    if (!record) return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
    if (record.is_deceased_locked || record.status === 'Deceased_Locked' || record.status === 'Transferred_To_Heirs') {
      return res.status(400).json({
        success: false,
        message: 'জমির মূল মালিক মৃত্যুবরণ করেছেন। মৃত্যু সনদ অনুমোদিত হওয়ায় ওয়ারিশদের মধ্যে বণ্টননামা (Bonton Nama) সম্পন্ন না হওয়া পর্যন্ত এই জমির দলিল সম্পাদন করা যাবে না।'
      });
    }

    if (record.status !== 'Active') {
      return res.status(400).json({ success: false, message: `জমিটি ইতিমধ্যে ${record.status} অবস্থায় আছে। দলিল করা সম্ভব নয়।` });
    }

    // ─────────────────────────────────────────────────────────────
    // MANDATORY OTP VERIFICATION
    // ─────────────────────────────────────────────────────────────
    const cleanOtp = (otp || '').toString().trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: '🔒 সাব-রেজিস্ট্রি অফিসে সকল ধরনের দলিল নিবন্ধনের ক্ষেত্রে ৬ ডিজিটের ওটিপি (OTP) ভেরিফিকেশন বাধ্যতামূলক। অনুগ্রহ করে ওটিপি কোড প্রদান করুন।'
      });
    }

    const { findLatestDeedOtp, updateOtpRecord, deleteDeedOtps } = require('../utils/dbStore');
    const otpRecord = await findLatestDeedOtp('', record._id.toString());

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'দলিল নিবন্ধনের জন্য কোনো সক্রিয় ওটিপি রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে প্রথমে "ওটিপি পাঠান" বাটনে ক্লিক করে ওটিপি নিন।'
      });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় নতুন ওটিপি পাঠান।'
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'সর্বোচ্চ ভুল প্রচেষ্টার সীমা অতিক্রম করেছে। পুনরায় নতুন ওটিপি কোড পাঠান।'
      });
    }

    if (otpRecord.otp !== cleanOtp) {
      const newAttempts = (otpRecord.attempts || 0) + 1;
      await updateOtpRecord(otpRecord, { attempts: newAttempts });
      return res.status(400).json({
        success: false,
        message: `ভুল ওটিপি কোড! অনুগ্রহ করে ইমেইলে প্রেরিত ৬ ডিজিটের কোডটি দিন। (বাকি চেষ্টা: ${5 - newAttempts})`
      });
    }

    // Mark verified and clean up
    await updateOtpRecord(otpRecord, { verified: true });
    await deleteDeedOtps(otpRecord.email, record._id.toString());

    // ─────────────────────────────────────────────────────────────
    // Process and verify buyer(s) (Joint Deed support)
    // ─────────────────────────────────────────────────────────────
    let buyersList = [];
    if (Array.isArray(buyers) && buyers.length > 0) {
      buyersList = buyers.filter(b => b && (b.nid || '').toString().trim().length > 0);
    }

    if (buyersList.length === 0) {
      const cleanBuyerNid = (buyer_nid || '').toString().trim();
      if (!cleanBuyerNid) {
        return res.status(400).json({ success: false, message: 'ক্রেতার NID প্রদান আবশ্যক।' });
      }
      buyersList.push({
        nid: cleanBuyerNid,
        name: buyer_name || '',
        phone: buyer_phone || '',
        email: buyer_email || '',
        share_decimal: parseFloat(sold_area || 0)
      });
    }

    // Verify each buyer in User database
    const verifiedBuyers = [];
    for (const b of buyersList) {
      const cleanNid = (b.nid || '').toString().trim();
      const engNid = toEnglishDigits(cleanNid);
      const bngNid = toBengaliDigits(cleanNid);

      const buyerUser = await User.findOne({
        $or: [{ nid: cleanNid }, { nid: engNid }, { nid: bngNid }]
      });

      if (!buyerUser) {
        return res.status(400).json({
          success: false,
          message: `⚠️ ক্রেতা [NID: ${cleanNid}] সিস্টেমে অনিবন্ধিত! শুধুমাত্র ডাটাবেজে নিবন্ধিত নাগরিকের নামেই জমি রেজিস্ট্রি সম্ভব।`
        });
      }

      verifiedBuyers.push({
        nid: buyerUser.nid,
        name: buyerUser.name || b.name,
        phone: buyerUser.phone || b.phone || '',
        email: buyerUser.email || b.email || '',
        share_decimal: parseFloat(b.share_decimal || 0)
      });
    }

    // Check LegalStatus for Court Case / Stay Order (using Dag + Mouza)
    const LegalStatus = require('../models/LegalStatus');
    const cleanDag = (record.dag_no || '').toString().trim();
    const cleanMouza = (record.mouza || '').toString().trim();
    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);

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

    if (legalNotice && (legalNotice.has_court_case || legalNotice.stay_order || legalNotice.is_khas)) {
      return res.status(400).json({
        success: false,
        message: legalNotice.stay_order
          ? `⛔ আদালতের Stay Order বলবৎ রয়েছে! [${legalNotice.case_details || ''}] জমিটি বিক্রয় বা ক্রেতার নামে রেজিস্ট্রি করা আইনত সম্পূর্ণ নিষিদ্ধ।`
          : legalNotice.has_court_case
          ? `⚖️ এই জমির ওপর আদালতে সক্রিয় মোকদ্দমা বিচারাধীন রয়েছে! [${legalNotice.case_details || ''}] মামলা নিষ্পত্তি না হওয়া পর্যন্ত হস্তান্তর অসম্ভব।`
          : `🚫 সরকারি খাস জমি ব্যক্তিগতভাবে বিক্রয় বা দলিল সম্পাদন সম্পূর্ণ নিষিদ্ধ।`
      });
    }

    // Calculate actual sold area
    const requestedSoldArea = parseFloat(sold_area || 0);
    const totalBuyerShare = verifiedBuyers.reduce((sum, b) => sum + (parseFloat(b.share_decimal) || 0), 0);
    let actualSoldArea = requestedSoldArea;
    if (totalBuyerShare > 0 && verifiedBuyers.length > 1) {
      actualSoldArea = totalBuyerShare;
    }
    if (!actualSoldArea || actualSoldArea <= 0) {
      actualSoldArea = record.available_area_decimal;
    }

    if (actualSoldArea > record.available_area_decimal) {
      return res.status(400).json({
        success: false,
        message: `⚠️ অপর্যাপ্ত জমি! বিক্রয়যোগ্য জমি আছে ${record.available_area_decimal} শতক, কিন্তু বিক্রয়ের জন্য চাওয়া হয়েছে ${actualSoldArea} শতক।`
      });
    }

    // Assign shares & percentages
    verifiedBuyers.forEach(b => {
      b.share_decimal = b.share_decimal > 0 ? b.share_decimal : parseFloat((actualSoldArea / verifiedBuyers.length).toFixed(4));
      b.share_percent = parseFloat(((b.share_decimal / actualSoldArea) * 100).toFixed(2));
    });

    const isJoint = verifiedBuyers.length > 1;
    const primaryBuyer = verifiedBuyers[0];
    const allBuyerNames = verifiedBuyers.map(b => b.name).join(', ');
    const allBuyerNids = verifiedBuyers.map(b => b.nid).join(', ');

    // Generate Enterprise Asymmetric PKI Digital Signature (RSA-2048) & Chained SHA-256 Hash with ALL essential land data!
    let prevDeed = null;
    try {
      prevDeed = await LandRecord.findOne({
        dag_no: record.dag_no,
        mouza: record.mouza,
        deed_hash: { $exists: true, $ne: null }
      }).sort({ createdAt: -1 });
    } catch (e) {}

    const cryptoPayload = generateLandCryptoPayload({
      deed_no,
      deed_year,
      sub_registry_code,
      volume_book: record.volume_book || '',
      page_no: record.page_no || '',
      dag_no: record.dag_no,
      khatian_no: record.khatian_no,
      jl_no: record.jl_no,
      mouza: record.mouza,
      upazila: record.upazila,
      district: record.district,
      division: record.division,
      owner_nid: record.owner_nid,
      owner_name: record.owner_name,
      buyer_nid: isJoint ? allBuyerNids : primaryBuyer.nid,
      buyer_name: isJoint ? allBuyerNames : primaryBuyer.name,
      buyers: verifiedBuyers,
      total_area_decimal: record.total_area_decimal,
      sold_area: actualSoldArea
    }, prevDeed);

    const deedHash = cryptoPayload.deed_hash;
    const qrCodeId = `QR-${deed_no}-${deed_year}-${record.dag_no}`;

    // Decrement seller's active record balance. Seller stays ACTIVE with remaining land!
    record.available_area_decimal = Math.max(0, record.available_area_decimal - actualSoldArea);
    record.last_updated = new Date();
    await record.save();

    // Create a dedicated Pending_Mutation record for this specific deed
    const pendingDeed = new LandRecord({
      record_id: `record_deed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      division: record.division || 'ঢাকা',
      district: record.district || 'ঢাকা',
      upazila: record.upazila || 'ধানমন্ডি',
      mouza: record.mouza,
      jl_no: record.jl_no,
      khatian_no: record.khatian_no,
      dag_no: record.dag_no,
      owner_nid: record.owner_nid,
      owner_name: record.owner_name,
      owner_phone: record.owner_phone || '',
      owner_email: record.owner_email || '',
      parent_record_id: record._id,
      total_area_decimal: actualSoldArea,
      available_area_decimal: 0,
      sold_area: actualSoldArea,
      status: 'Pending_Mutation',
      deed_no,
      deed_year,
      sub_registry_code,
      deed_hash: deedHash,
      previous_hash: cryptoPayload.previous_hash,
      chain_sequence: cryptoPayload.chain_sequence,
      digital_signature: cryptoPayload.digital_signature,
      signed_by_role: 'Register Office',
      signer_public_key: cryptoPayload.signer_public_key,
      crypto_metadata: cryptoPayload.crypto_metadata,
      qr_code_id: qrCodeId,
      buyer_nid: isJoint ? allBuyerNids : primaryBuyer.nid,
      buyer_name: isJoint ? allBuyerNames : primaryBuyer.name,
      buyer_phone: primaryBuyer.phone,
      buyer_email: primaryBuyer.email,
      buyers: verifiedBuyers,
      is_joint_ownership: isJoint,
      remarks: isJoint ? `যৌথ কবলা দলিল (${verifiedBuyers.length} জন ক্রেতা)` : 'একক দলিল'
    });
    await pendingDeed.save();

    logActivity({
      req,
      actor: { name: 'সাব-রেজিস্ট্রার (শিবগঞ্জ)', role: 'Register Office' },
      action_type: 'DEED_GRANTED',
      module: 'Deed_Registry',
      description: `সাব-রেজিস্ট্রার কর্তৃক দলিল মঞ্জুর ও বায়োমেট্রিক/OTP যাচাই সম্পন্ন: দলিল নং ${deed_no}, জমির পরিমাণ ${actualSoldArea} শতক`,
      target_resource: `মৌজা: ${record.mouza}, দাগ: ${record.dag_no}, খতিয়ান: ${record.khatian_no || '১'}`,
      details: {
        deed_no,
        deed_year,
        seller: record.owner_name,
        seller_nid: record.owner_nid,
        buyer: pendingDeed.buyer_name,
        buyer_nid: pendingDeed.buyer_nid,
        sold_area: actualSoldArea,
        remaining_area: record.available_area_decimal
      }
    });

    logActivity({
      req,
      actor: { name: 'সাব-রেজিস্ট্রার (শিবগঞ্জ)', role: 'Register Office' },
      action_type: 'DEED_GRANTED',
      module: 'Deed_Registry',
      description: `সাব-রেজিস্ট্রার কর্তৃক দলিল মঞ্জুর ও বায়োমেট্রিক/OTP যাচাই সম্পন্ন: দলিল নং ${deed_no}, জমির পরিমাণ ${actualSoldArea} শতক`,
      target_resource: `মৌজা: ${record.mouza}, দাগ: ${record.dag_no}, খতিয়ান: ${record.khatian_no || '১'}`,
      details: {
        deed_no,
        deed_year,
        seller: record.owner_name,
        seller_nid: record.owner_nid,
        buyer: pendingDeed.buyer_name,
        buyer_nid: pendingDeed.buyer_nid,
        sold_area: actualSoldArea,
        remaining_area: record.available_area_decimal
      }
    });

    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({
      success: true,
      message: isJoint
        ? `✅ যৌথ দলিল অনুমোদিত হয়েছে (${verifiedBuyers.length} জন ক্রেতা, মোট ${actualSoldArea} শতক)। বিক্রেতার অবশিষ্ট জমি: ${record.available_area_decimal} শতক।`
        : `✅ Deed Granted! দলিল অনুমোদিত হয়েছে (${actualSoldArea} শতক)। বিক্রেতার অবশিষ্ট জমি: ${record.available_area_decimal} শতক।`,
      deed_hash: deedHash,
      qr_code_id: qrCodeId,
      record: {
        _id: pendingDeed._id,
        mouza: pendingDeed.mouza,
        jl_no: pendingDeed.jl_no,
        khatian_no: pendingDeed.khatian_no,
        dag_no: pendingDeed.dag_no,
        owner_name: pendingDeed.owner_name,
        owner_nid: pendingDeed.owner_nid,
        buyer_name: pendingDeed.buyer_name,
        buyer_nid: pendingDeed.buyer_nid,
        buyer_phone: pendingDeed.buyer_phone,
        buyer_email: pendingDeed.buyer_email,
        buyers: verifiedBuyers,
        is_joint_ownership: isJoint,
        sold_area: actualSoldArea,
        deed_no: pendingDeed.deed_no,
        deed_year: pendingDeed.deed_year,
        sub_registry_code: pendingDeed.sub_registry_code,
        deed_hash: pendingDeed.deed_hash,
        qr_code_id: pendingDeed.qr_code_id,
        status: pendingDeed.status
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/pending-mutations
// P4 End 2: AC Land dashboard - get all Pending_Mutation applications
router.get('/pending-mutations', async (req, res) => {
  try {
    const records = await LandRecord.find({ status: 'Pending_Mutation' }).sort({ last_updated: -1 });
    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/issue-namjari
// P4 End 2: AC Land issues namjari, triggers payment email notification
router.post('/issue-namjari', async (req, res) => {
  try {
    const { record_id } = req.body;

    const record = await LandRecord.findById(record_id);
    if (!record) return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
    if (record.status !== 'Pending_Mutation') {
      return res.status(400).json({ success: false, message: 'শুধুমাত্র Pending_Mutation রেকর্ডের নামজারি ইস্যু করা যাবে।' });
    }

    record.namjari_issued = true;
    record.payment_status = 'Pending';
    record.last_updated = new Date();
    await record.save();

    // Payment link for buyer (uses bound FRONTEND_URL service binding or local dev fallback)
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').trim();
    const paymentLink = new URL(`payment/${record._id}`, frontendBase.endsWith('/') ? frontendBase : `${frontendBase}/`).toString();

    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({
      success: true,
      message: '📧 নামজারি ইস্যু করা হয়েছে। ক্রেতার কাছে পেমেন্ট লিংক পাঠানো হয়েছে।',
      payment_link: paymentLink,
      buyer_email: record.buyer_email,
      buyer_name: record.buyer_name,
      record: {
        _id: record._id,
        mouza: record.mouza,
        dag_no: record.dag_no,
        buyer_name: record.buyer_name,
        buyer_email: record.buyer_email,
        deed_hash: record.deed_hash,
        qr_code_id: record.qr_code_id
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/approve-mutation
// AC Land Officer directly approves mutation, transfers ownership, and generates Namjari Khotiyan
router.post('/approve-mutation', async (req, res) => {
  try {
    const { record_id, remarks, officer_name } = req.body;

    const oldRecord = await LandRecord.findById(record_id);
    if (!oldRecord) return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
    if (oldRecord.status === 'Sold') {
      return res.status(400).json({ success: false, message: 'এই জমির নামজারি ও মালিকানা হস্তান্তর ইতিমধ্যে সম্পন্ন হয়েছে।' });
    }

    const soldArea = parseFloat(oldRecord.sold_area || oldRecord.total_area_decimal);
    const isJoint = oldRecord.is_joint_ownership || (oldRecord.buyers && oldRecord.buyers.length > 1);
    const buyerList = (oldRecord.buyers && oldRecord.buyers.length > 0) ? oldRecord.buyers : [
      {
        nid: oldRecord.buyer_nid,
        name: oldRecord.buyer_name,
        phone: oldRecord.buyer_phone || '',
        email: oldRecord.buyer_email || '',
        share_decimal: soldArea,
        share_percent: 100
      }
    ];

    // Mark current pending record as Sold & Paid
    oldRecord.status = 'Sold';
    oldRecord.payment_status = 'Paid';
    oldRecord.namjari_issued = true;
    oldRecord.last_updated = new Date();
    await oldRecord.save();

    // Create new Active LandRecord for buyer(s)
    const newQrId = `QR-NAMJARI-${oldRecord.dag_no}-${Date.now()}`;
    const newKhatianNo = oldRecord.khatian_no.includes('-M') 
      ? `${oldRecord.khatian_no}-${Date.now().toString().slice(-3)}` 
      : `${oldRecord.khatian_no}-M`;

    const newKhatianCrypto = generateLandCryptoPayload({
      deed_no: oldRecord.deed_no,
      deed_year: oldRecord.deed_year,
      sub_registry_code: oldRecord.sub_registry_code,
      volume_book: oldRecord.volume_book || '',
      page_no: oldRecord.page_no || '',
      dag_no: oldRecord.dag_no,
      khatian_no: newKhatianNo,
      jl_no: oldRecord.jl_no,
      mouza: oldRecord.mouza,
      upazila: oldRecord.upazila,
      district: oldRecord.district,
      division: oldRecord.division,
      owner_nid: oldRecord.buyer_nid || 'N/A',
      owner_name: oldRecord.buyer_name || 'নতুন মালিক',
      buyer_nid: oldRecord.buyer_nid || 'N/A',
      buyer_name: oldRecord.buyer_name || 'নতুন মালিক',
      buyers: buyerList,
      total_area_decimal: soldArea,
      sold_area: soldArea
    }, oldRecord);

    const newRecord = new LandRecord({
      record_id: `record_${Date.now()}`,
      division: oldRecord.division || 'ঢাকা',
      district: oldRecord.district || 'ঢাকা',
      upazila: oldRecord.upazila || 'ধানমন্ডি',
      mouza: oldRecord.mouza,
      jl_no: oldRecord.jl_no,
      khatian_no: newKhatianNo,
      dag_no: oldRecord.dag_no,
      owner_nid: oldRecord.buyer_nid || 'N/A',
      owner_name: oldRecord.buyer_name || 'নতুন মালিক',
      owner_phone: oldRecord.buyer_phone || '',
      owner_email: oldRecord.buyer_email || '',
      total_area_decimal: soldArea,
      available_area_decimal: soldArea,
      status: 'Active',
      qr_code_id: newQrId,
      deed_no: oldRecord.deed_no,
      deed_year: oldRecord.deed_year,
      sub_registry_code: oldRecord.sub_registry_code,
      deed_hash: newKhatianCrypto.deed_hash,
      previous_hash: newKhatianCrypto.previous_hash,
      chain_sequence: newKhatianCrypto.chain_sequence,
      digital_signature: newKhatianCrypto.digital_signature,
      signed_by_role: 'AC Land Office',
      signer_public_key: newKhatianCrypto.signer_public_key,
      crypto_metadata: newKhatianCrypto.crypto_metadata,
      is_joint_ownership: isJoint,
      co_owners: buyerList,
      buyers: buyerList,
      remarks: remarks || `সহকারী কমিশনার (ভূমি) কর্তৃক অনুমোদিত ই-নামজারি খতিয়ান${isJoint ? ` (যৌথ মালিকানা: ${buyerList.length} জন)` : ''}। সাবেক খতিয়ান: ${oldRecord.khatian_no}`
    });
    await newRecord.save();

    // If this pending record was branched from a parent active record, update parent's total
    if (oldRecord.parent_record_id) {
      const parentRecord = await LandRecord.findById(oldRecord.parent_record_id);
      if (parentRecord) {
        parentRecord.total_area_decimal = parseFloat(Math.max(0, parentRecord.total_area_decimal - soldArea).toFixed(4));
        if (parentRecord.total_area_decimal <= 0.0001 && parentRecord.available_area_decimal <= 0.0001) {
          parentRecord.status = 'Sold';
        }
        parentRecord.last_updated = new Date();
        await parentRecord.save();
      }
    } else {
      // Legacy fallback: if oldRecord is the main record itself
      const originalTotal = parseFloat(oldRecord.total_area_decimal);
      const remainingArea = parseFloat(Math.max(0, originalTotal - soldArea).toFixed(4));
      if (remainingArea > 0.0001) {
        oldRecord.total_area_decimal = remainingArea;
        oldRecord.available_area_decimal = remainingArea;
        oldRecord.status = 'Active';
        oldRecord.sold_area = null;
        await oldRecord.save();
      }
    }

    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({
      success: true,
      message: `🎉 এসি ল্যান্ড কর্তৃক নামজারি অনুমোদন সম্পন্ন! নতুন খতিয়ান নং: ${newKhatianNo} প্রস্তুত ও ক্রেতা ${newRecord.owner_name}-এর নামে অর্পিত হয়েছে।`,
      khatian_data: {
        new_record_id: newRecord._id,
        division: newRecord.division,
        district: newRecord.district,
        upazila: newRecord.upazila,
        mouza: newRecord.mouza,
        jl_no: newRecord.jl_no,
        khatian_no: newRecord.khatian_no,
        dag_no: newRecord.dag_no,
        owner_name: newRecord.owner_name,
        owner_nid: newRecord.owner_nid,
        owner_phone: newRecord.owner_phone,
        total_area_decimal: newRecord.total_area_decimal,
        deed_no: newRecord.deed_no,
        deed_hash: newRecord.deed_hash,
        qr_code_id: newRecord.qr_code_id,
        is_joint_ownership: newRecord.is_joint_ownership,
        co_owners: newRecord.co_owners,
        issue_date: new Date().toLocaleDateString('bn-BD'),
        status: 'Active'
      }
    });
  } catch (err) {
    console.error('Approve mutation error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/complete-payment
// P4: Payment done - transfer ownership, create new Active record for buyer
router.post('/complete-payment', async (req, res) => {
  try {
    const { record_id } = req.body;

    const oldRecord = await LandRecord.findById(record_id);
    if (!oldRecord) return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
    if (oldRecord.payment_status === 'Paid') {
      return res.status(400).json({ success: false, message: 'পেমেন্ট ইতিমধ্যে সম্পন্ন হয়েছে।' });
    }

    const soldArea = parseFloat(oldRecord.sold_area || oldRecord.total_area_decimal);
    const isJoint = oldRecord.is_joint_ownership || (oldRecord.buyers && oldRecord.buyers.length > 1);
    const buyerList = (oldRecord.buyers && oldRecord.buyers.length > 0) ? oldRecord.buyers : [
      {
        nid: oldRecord.buyer_nid,
        name: oldRecord.buyer_name,
        phone: oldRecord.buyer_phone || '',
        email: oldRecord.buyer_email || '',
        share_decimal: soldArea,
        share_percent: 100
      }
    ];

    // Mark current pending record as Sold & Paid
    oldRecord.status = 'Sold';
    oldRecord.payment_status = 'Paid';
    oldRecord.last_updated = new Date();
    await oldRecord.save();

    // Create new Active record for buyer(s)
    const newQrId = `QR-NAMJARI-${oldRecord.dag_no}-${Date.now()}`;
    const newKhatianNo = oldRecord.khatian_no.includes('-M') 
      ? `${oldRecord.khatian_no}-${Date.now().toString().slice(-3)}` 
      : `${oldRecord.khatian_no}-M`;

    const newRecord = new LandRecord({
      record_id: `record_${Date.now()}`,
      division: oldRecord.division || 'ঢাকা',
      district: oldRecord.district || 'ঢাকা',
      upazila: oldRecord.upazila || 'ধানমন্ডি',
      mouza: oldRecord.mouza,
      jl_no: oldRecord.jl_no,
      khatian_no: newKhatianNo,
      dag_no: oldRecord.dag_no,
      owner_nid: oldRecord.buyer_nid || 'N/A',
      owner_name: oldRecord.buyer_name || 'নতুন মালিক',
      owner_phone: oldRecord.buyer_phone || '',
      owner_email: oldRecord.buyer_email || '',
      total_area_decimal: soldArea,
      available_area_decimal: soldArea,
      status: 'Active',
      qr_code_id: newQrId,
      deed_no: oldRecord.deed_no,
      deed_year: oldRecord.deed_year,
      sub_registry_code: oldRecord.sub_registry_code,
      deed_hash: oldRecord.deed_hash,
      is_joint_ownership: isJoint,
      co_owners: buyerList,
      buyers: buyerList,
      remarks: `সহকারী কমিশনার (ভূমি) কর্তৃক অনুমোদিত ই-নামজারি খতিয়ান${isJoint ? ` (যৌথ মালিকানা: ${buyerList.length} জন)` : ''}। সাবেক খতিয়ান: ${oldRecord.khatian_no}`
    });
    await newRecord.save();

    // If this pending record was branched from a parent active record, update parent's total
    if (oldRecord.parent_record_id) {
      const parentRecord = await LandRecord.findById(oldRecord.parent_record_id);
      if (parentRecord) {
        parentRecord.total_area_decimal = parseFloat(Math.max(0, parentRecord.total_area_decimal - soldArea).toFixed(4));
        if (parentRecord.total_area_decimal <= 0.0001 && parentRecord.available_area_decimal <= 0.0001) {
          parentRecord.status = 'Sold';
        }
        parentRecord.last_updated = new Date();
        await parentRecord.save();
      }
    } else {
      // Legacy fallback
      const originalTotal = parseFloat(oldRecord.total_area_decimal);
      const remainingArea = parseFloat(Math.max(0, originalTotal - soldArea).toFixed(4));
      if (remainingArea > 0.0001) {
        oldRecord.total_area_decimal = remainingArea;
        oldRecord.available_area_decimal = remainingArea;
        oldRecord.status = 'Active';
        oldRecord.sold_area = null;
        await oldRecord.save();
      }
    }

    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({
      success: true,
      message: '🎉 পেমেন্ট সম্পন্ন! মালিকানা হস্তান্তর সফলভাবে সম্পন্ন হয়েছে। নতুন নামজারি খতিয়ান তৈরি হয়েছে।',
      khatian_data: {
        new_record_id: newRecord._id,
        division: newRecord.division,
        district: newRecord.district,
        upazila: newRecord.upazila,
        mouza: newRecord.mouza,
        jl_no: newRecord.jl_no,
        khatian_no: newRecord.khatian_no,
        dag_no: newRecord.dag_no,
        owner_name: newRecord.owner_name,
        owner_nid: newRecord.owner_nid,
        owner_phone: newRecord.owner_phone,
        total_area_decimal: newRecord.total_area_decimal,
        deed_no: newRecord.deed_no,
        deed_hash: newRecord.deed_hash,
        qr_code_id: newRecord.qr_code_id,
        is_joint_ownership: newRecord.is_joint_ownership,
        co_owners: newRecord.co_owners,
        issue_date: new Date().toLocaleDateString('bn-BD'),
        status: 'Active'
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/land-records - For registry panel to search records (Standard: Mouza + Dag + Khatian)
router.get('/land-records', async (req, res) => {
  try {
    const { seller_nid, dag_no, mouza, khatian_no } = req.query;
    const cleanDag = (dag_no || '').toString().trim();
    const cleanMouza = (mouza || '').toString().trim();
    const cleanKhatian = (khatian_no || '').toString().trim();
    const cleanSellerNid = (seller_nid || '').toString().trim();

    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);
    const engKhatian = toEnglishDigits(cleanKhatian);
    const bngKhatian = toBengaliDigits(cleanKhatian);
    const engSellerNid = toEnglishDigits(cleanSellerNid);
    const bngSellerNid = toBengaliDigits(cleanSellerNid);

    let query = {};
    if (cleanMouza) {
      query.mouza = { $regex: new RegExp(`^${cleanMouza}$`, 'i') };
    }
    if (cleanDag) {
      query.$or = [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }];
    }
    if (cleanKhatian) {
      const khatianConditions = [{ khatian_no: cleanKhatian }, { khatian_no: engKhatian }, { khatian_no: bngKhatian }];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: khatianConditions }];
        delete query.$or;
      } else {
        query.$or = khatianConditions;
      }
    }
    if (cleanSellerNid) {
      const nidConditions = [{ owner_nid: cleanSellerNid }, { owner_nid: engSellerNid }, { owner_nid: bngSellerNid }];
      if (query.$and) {
        query.$and.push({ $or: nidConditions });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: nidConditions }];
        delete query.$or;
      } else {
        query.$or = nidConditions;
      }
    }

    let records = [];
    if (Object.keys(query).length > 0) {
      records = await LandRecord.find(query).sort({ status: 1, updatedAt: -1 });
    } else {
      records = await LandRecord.find({}).sort({ updatedAt: -1 }).limit(20);
    }

    logActivity({
      req,
      actor: { name: officer_name || 'সহকারী কমিশনার (ভূমি)', role: 'AC Land Office' },
      action_type: 'MUTATION_APPROVED',
      module: 'Mutation',
      description: `সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি অনুমোদন ও নতুন খতিয়ান সৃষ্টি: সাবেক খতিয়ান ${oldRecord.khatian_no} ➔ নতুন খতিয়ান ${newKhatianNo} (${soldArea} শতক)`,
      target_resource: `মৌজা: ${oldRecord.mouza}, দাগ: ${oldRecord.dag_no}, নতুন খতিয়ান: ${newKhatianNo}`,
      details: {
        deed_no: oldRecord.deed_no,
        former_owner: oldRecord.owner_name,
        new_owner: newRecord.owner_name,
        new_khatian: newKhatianNo,
        area: soldArea,
        officer_name
      }
    });

    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
