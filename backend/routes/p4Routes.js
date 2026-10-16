const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const LandRecord = require('../models/LandRecord');
const User = require('../models/User');

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
      sold_area
    } = req.body;

    const record = await LandRecord.findById(record_id);
    if (!record) return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
    if (record.status !== 'Active') {
      return res.status(400).json({ success: false, message: `জমিটি ইতিমধ্যে ${record.status} অবস্থায় আছে। দলিল করা সম্ভব নয়।` });
    }

    // Verify Buyer NID in User database
    const cleanBuyerNid = (buyer_nid || '').toString().trim();
    if (!cleanBuyerNid) {
      return res.status(400).json({ success: false, message: 'ক্রেতার NID প্রদান আবশ্যক।' });
    }

    const engBuyerNid = toEnglishDigits(cleanBuyerNid);
    const bngBuyerNid = toBengaliDigits(cleanBuyerNid);

    const buyerUser = await User.findOne({
      $or: [{ nid: cleanBuyerNid }, { nid: engBuyerNid }, { nid: bngBuyerNid }]
    });

    if (!buyerUser) {
      return res.status(400).json({
        success: false,
        message: '⚠️ ক্রেতার NID সিস্টেমে অনিবন্ধিত! শুধুমাত্র ডাটাবেজে নিবন্ধিত নাগরিকের নামেই জমি রেজিস্ট্রি ও মিউটেশন সম্ভব। ক্রেতাকে প্রথমে সিস্টেমে নিবন্ধন করতে বলুন।'
      });
    }

    const verifiedBuyerName = buyerUser.name || buyer_name;
    const verifiedBuyerEmail = buyerUser.email || buyer_email;
    const verifiedBuyerPhone = buyerUser.phone || buyer_phone;

    // Check LegalStatus for Court Case / Stay Order
    const LegalStatus = require('../models/LegalStatus');
    const cleanDag = (record.dag_no || '').toString().trim();
    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);

    const legalNotice = await LegalStatus.findOne({
      $or: [
        { dag_no: cleanDag },
        { dag_no: engDag },
        { dag_no: bngDag }
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

    // Check area availability
    const requestedSoldArea = parseFloat(sold_area || 0);
    if (requestedSoldArea > record.available_area_decimal) {
      return res.status(400).json({
        success: false,
        message: `⚠️ অপর্যাপ্ত জমি! বিক্রয়যোগ্য জমি আছে ${record.available_area_decimal} শতক, কিন্তু বিক্রয়ের জন্য চাওয়া হয়েছে ${requestedSoldArea} শতক।`
      });
    }

    // Generate SHA-256 hash
    const hashData = `${deed_no}-${deed_year}-${record.dag_no}-${record.owner_nid}-${buyerUser.nid}-${Date.now()}`;
    const deedHash = crypto.createHash('sha256').update(hashData).digest('hex');
    const qrCodeId = `QR-${deed_no}-${deed_year}-${record.dag_no}`;

    // Update record
    record.deed_no = deed_no;
    record.deed_year = deed_year;
    record.sub_registry_code = sub_registry_code;
    record.deed_hash = deedHash;
    record.qr_code_id = qrCodeId;
    record.buyer_nid = buyerUser.nid;
    record.buyer_name = verifiedBuyerName;
    record.buyer_phone = verifiedBuyerPhone;
    record.buyer_email = verifiedBuyerEmail;
    record.sold_area = requestedSoldArea || record.available_area_decimal;
    record.status = 'Pending_Mutation';
    record.available_area_decimal = Math.max(0, record.available_area_decimal - (requestedSoldArea || record.available_area_decimal));
    record.last_updated = new Date();
    await record.save();

    return res.status(200).json({
      success: true,
      message: '✅ Deed Granted! দলিল অনুমোদিত হয়েছে। জমি Pending Mutation-এ লক করা হয়েছে।',
      deed_hash: deedHash,
      qr_code_id: qrCodeId,
      record: {
        _id: record._id,
        mouza: record.mouza,
        jl_no: record.jl_no,
        khatian_no: record.khatian_no,
        dag_no: record.dag_no,
        owner_name: record.owner_name,
        owner_nid: record.owner_nid,
        buyer_name: record.buyer_name,
        buyer_nid: record.buyer_nid,
        buyer_phone: record.buyer_phone,
        buyer_email: record.buyer_email,
        sold_area: sold_area,
        deed_no: record.deed_no,
        deed_year: record.deed_year,
        sub_registry_code: record.sub_registry_code,
        deed_hash: record.deed_hash,
        qr_code_id: record.qr_code_id,
        status: record.status
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

    // Mark old record as Sold
    oldRecord.status = 'Sold';
    oldRecord.payment_status = 'Paid';
    oldRecord.namjari_issued = true;
    oldRecord.last_updated = new Date();
    await oldRecord.save();

    // Create new Active LandRecord for buyer
    const newQrId = `QR-NAMJARI-${oldRecord.dag_no}-${Date.now()}`;
    const newKhatianNo = oldRecord.khatian_no.includes('-M') ? oldRecord.khatian_no : `${oldRecord.khatian_no}-M`;

    const newRecord = new LandRecord({
      record_id: `record_${Date.now()}`,
      division: oldRecord.division || 'ঢাকা',
      district: oldRecord.district || 'ঢাকা',
      upazila: oldRecord.upazila || 'ধানমন্ডি',
      mouza: oldRecord.mouza,
      jl_no: oldRecord.jl_no,
      khatian_no: newKhatianNo,
      dag_no: oldRecord.dag_no,
      owner_nid: oldRecord.buyer_nid || oldRecord.owner_nid || 'N/A',
      owner_name: oldRecord.buyer_name || oldRecord.owner_name || 'নতুন মালিক',
      owner_phone: oldRecord.buyer_phone || oldRecord.owner_phone || '',
      owner_email: oldRecord.buyer_email || oldRecord.owner_email || '',
      total_area_decimal: parseFloat(oldRecord.sold_area || oldRecord.total_area_decimal),
      available_area_decimal: parseFloat(oldRecord.sold_area || oldRecord.total_area_decimal),
      status: 'Active',
      qr_code_id: newQrId,
      deed_no: oldRecord.deed_no,
      deed_year: oldRecord.deed_year,
      deed_hash: oldRecord.deed_hash,
      remarks: remarks || `সহকারী কমিশনার (ভূমি) কর্তৃক অনুমোদিত ই-নামজারি খতিয়ান। সাবেক খতিয়ান: ${oldRecord.khatian_no}`
    });
    await newRecord.save();

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

    // Update old record to Sold
    oldRecord.status = 'Sold';
    oldRecord.payment_status = 'Paid';
    oldRecord.last_updated = new Date();
    await oldRecord.save();

    // Create new Active record for buyer
    const newQrId = `QR-NEW-${oldRecord.dag_no}-${Date.now()}`;
    const newRecord = new LandRecord({
      record_id: `record_${Date.now()}`,
      division: oldRecord.division || 'ঢাকা',
      district: oldRecord.district || 'ঢাকা',
      upazila: oldRecord.upazila || 'ধানমন্ডি',
      mouza: oldRecord.mouza,
      jl_no: oldRecord.jl_no,
      khatian_no: `${oldRecord.khatian_no}-M`, // Mutated khatian
      dag_no: oldRecord.dag_no,
      owner_nid: oldRecord.buyer_nid || oldRecord.owner_nid || 'N/A',
      owner_name: oldRecord.buyer_name || oldRecord.owner_name || 'নতুন মালিক',
      owner_phone: oldRecord.buyer_phone || oldRecord.owner_phone || '',
      owner_email: oldRecord.buyer_email || oldRecord.owner_email || '',
      total_area_decimal: parseFloat(oldRecord.total_area_decimal),
      available_area_decimal: parseFloat(oldRecord.total_area_decimal),
      status: 'Active',
      qr_code_id: newQrId,
      deed_hash: oldRecord.deed_hash
    });
    await newRecord.save();

    return res.status(200).json({
      success: true,
      message: '🎉 পেমেন্ট সম্পন্ন! মালিকানা হস্তান্তর সফলভাবে সম্পন্ন হয়েছে। নতুন নামজারি খতিয়ান তৈরি হয়েছে।',
      khatian_data: {
        new_record_id: newRecord._id,
        mouza: newRecord.mouza,
        jl_no: newRecord.jl_no,
        khatian_no: newRecord.khatian_no,
        dag_no: newRecord.dag_no,
        owner_name: newRecord.owner_name,
        owner_nid: newRecord.owner_nid,
        total_area_decimal: newRecord.total_area_decimal,
        deed_hash: newRecord.deed_hash,
        qr_code_id: newRecord.qr_code_id,
        issue_date: new Date().toLocaleDateString('bn-BD'),
        status: 'Active'
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/land-records - For registry panel to search records
router.get('/land-records', async (req, res) => {
  try {
    const { seller_nid, dag_no, mouza } = req.query;
    const cleanDag = (dag_no || '').toString().trim();
    const cleanMouza = (mouza || '').toString().trim();
    const cleanSellerNid = (seller_nid || '').toString().trim();

    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);
    const engSellerNid = toEnglishDigits(cleanSellerNid);
    const bngSellerNid = toBengaliDigits(cleanSellerNid);

    let query = {};
    if (cleanMouza) {
      query.mouza = { $regex: new RegExp(`^${cleanMouza}$`, 'i') };
    }
    if (cleanDag) {
      query.$or = [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }];
    }
    if (cleanSellerNid) {
      const nidConditions = [{ owner_nid: cleanSellerNid }, { owner_nid: engSellerNid }, { owner_nid: bngSellerNid }];
      if (query.$or) {
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

    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
