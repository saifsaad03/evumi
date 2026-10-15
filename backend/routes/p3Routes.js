const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');

// POST /api/verify-deed
// P3: Step 1 & 2 - Seller NID check + Land Volume check
router.post('/verify-deed', async (req, res) => {
  try {
    const { seller_nid, dag_no, mouza, jl_no, khatian_no, requested_area } = req.body;

    if (!seller_nid || !dag_no || !mouza || !requested_area) {
      return res.status(400).json({ success: false, message: 'সকল তথ্য প্রদান করুন।' });
    }

    const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
    const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

    const cleanDag = dag_no.toString().trim();
    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);
    const cleanMouza = mouza.toString().trim();

    // Check if land exists in DB
    let record = await LandRecord.findOne({
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }]
    });

    if (!record) {
      return res.status(200).json({
        success: false,
        alert_type: 'NOT_FOUND',
        message: '⚠️ এই দাগ ও মৌজায় নিবন্ধিত কোনো জমির রেকর্ড পাওয়া যায়নি (ডাটাবেজে জমিটি অস্তিত্বহীন বা বরাদ্দপ্রাপ্ত নয়)।'
      });
    }

    // Check Super Admin Legal Notice / Court Case / Stay Order
    const legalNotice = await LegalStatus.findOne({
      $or: [
        { dag_no: cleanDag },
        { dag_no: engDag },
        { dag_no: bngDag }
      ]
    });

    if (legalNotice && (legalNotice.has_court_case || legalNotice.stay_order || legalNotice.is_khas)) {
      let caseMsg = '';
      if (legalNotice.stay_order) {
        caseMsg = `⛔ আদালতের স্থগিতাদেশ (Stay Order): এই জমিতে বিজ্ঞ আদালতের নিষেধাজ্ঞা / Stay Order বলবৎ রয়েছে! ${legalNotice.case_details ? `[মামলা/আদেশ: ${legalNotice.case_details}]` : ''}। জমিটি বিক্রি, হস্তান্তর বা ক্রেতার নামে দলিল সম্পাদন সম্পূর্ণ নিষিদ্ধ।`;
      } else if (legalNotice.has_court_case) {
        caseMsg = `⚖️ আদালতীয় মামলা সতর্কতা (Active Court Dispute): এই জমির ওপর আদালতে সক্রিয় দেওয়ানি মোকদ্দমা / স্বত্ব মামলা বিচারাধীন রয়েছে! ${legalNotice.case_details ? `[মামলার বিবরণ: ${legalNotice.case_details}]` : ''}। মামলা নিষ্পত্তি না হওয়া পর্যন্ত জমিটি অনিরাপদ এবং বিক্রয়যোগ্য নয়।`;
      } else if (legalNotice.is_khas) {
        caseMsg = `🚫 সরকারি খাস জমি: এটি ১নং সরকারি খাস খতিয়ানের জমি (${legalNotice.khas_reason || 'সরকারি খাস সম্পত্তি'})। ব্যক্তি মালিকানাধীন হস্তান্তর সম্পূর্ণ অবৈধ।`;
      }

      return res.status(200).json({
        success: false,
        alert_type: 'COURT_CASE_STAY_ORDER',
        message: caseMsg,
        court_case: {
          has_court_case: !!legalNotice.has_court_case,
          stay_order: !!legalNotice.stay_order,
          is_khas: !!legalNotice.is_khas,
          case_details: legalNotice.case_details || ''
        }
      });
    }

    // Check if land is unassigned / government khas land not assigned to any citizen
    const isUnassigned = !record.owner_nid ||
      record.owner_nid === '1000000000000' ||
      record.owner_nid === 'অনলাইনে রেকর্ড নেই' ||
      record.owner_name === 'অনলাইনে অনিবন্ধিত' ||
      (record.owner_name && record.owner_name.includes('সরকার')) ||
      (record.owner_name && record.owner_name.includes('খাস'));

    if (isUnassigned) {
      return res.status(200).json({
        success: false,
        alert_type: 'UNASSIGNED_LAND',
        message: '⚠️ এই জমিটি বর্তমানে অনলাইনে অনিবন্ধিত খাস জমি হিসেবে চিহ্নিত। কোনো নাগরিকের নামে বরাদ্দ না থাকায় এর দলিল রেজিস্ট্রি করা যাবে না।'
      });
    }

    // Check Anti-Double Selling & Assignment Lock
    if (record.status === 'Pending_Mutation' || record.status === 'Pending_AC_Land_Review') {
      return res.status(200).json({
        success: false,
        alert_type: 'DOUBLE_SELL',
        message: `🔴 ডাবল-সেলিং সতর্কতা (Double-Selling Alert): এই জমির একটি দলিল বা নামজারি প্রক্রিয়া বর্তমানে চলমান (${record.status})! জমিটি লক আছে, নতুন দলিল করা যাবে না।`,
        status: record.status
      });
    }

    if (record.status === 'Sold') {
      return res.status(200).json({
        success: false,
        alert_type: 'ALREADY_SOLD',
        message: '🔴 জমিটি ইতিমধ্যে অন্য ক্রেতার নিকট বিক্রয় ও মালিকানা হস্তান্তর সম্পন্ন হয়েছে (Status: Sold)।',
        status: 'Sold'
      });
    }

    // Step 1: Seller NID Verification (normalize both to English digits for comparison)
    const normalizedOwnerNid = toEnglishDigits(record.owner_nid);
    const normalizedSellerNid = toEnglishDigits(seller_nid);
    if (normalizedOwnerNid !== normalizedSellerNid) {
      // Log fraud alert
      record.fraud_alerts.push({
        type: 'FAKE_OWNER',
        message: 'Fraud Alert: Fake Owner Detected',
        attempted_nid: seller_nid
      });
      record.last_updated = new Date();
      await record.save();

      return res.status(200).json({
        success: false,
        alert_type: 'FAKE_OWNER',
        message: '🚨 Fraud Alert: Fake Owner Detected! প্রদত্ত NID ডেটাবেজের বর্তমান মালিকের NID-এর সাথে মেলেনি।',
        record_owner: record.owner_name
      });
    }

    // Step 2: Land Volume Check
    if (parseFloat(requested_area) > record.available_area_decimal) {
      return res.status(200).json({
        success: false,
        alert_type: 'INSUFFICIENT_AREA',
        message: `⚠️ Error: Insufficient Land Volume! বিক্রয়যোগ্য জমি ${record.available_area_decimal} শতাংশ, কিন্তু আবেদন করা হয়েছে ${requested_area} শতাংশ।`,
        available_area: record.available_area_decimal
      });
    }

    // All checks passed
    return res.status(200).json({
      success: true,
      alert_type: 'VERIFIED',
      message: '✅ Verified: বিক্রেতার মালিকানা ও জমির পরিমাণ যাচাই সম্পন্ন। দলিল অনুমোদনের জন্য প্রস্তুত।',
      record: {
        _id: record._id,
        mouza: record.mouza,
        jl_no: record.jl_no,
        khatian_no: record.khatian_no,
        dag_no: record.dag_no,
        owner_name: record.owner_name,
        owner_nid: record.owner_nid,
        available_area_decimal: record.available_area_decimal,
        total_area_decimal: record.total_area_decimal,
        status: record.status
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// POST /api/lock-property
// P3 Step 3: Lock the property as Pending_Mutation after deed is confirmed
router.post('/lock-property', async (req, res) => {
  try {
    const { record_id, sold_area } = req.body;

    const record = await LandRecord.findById(record_id);
    if (!record) return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });

    if (record.status !== 'Active') {
      return res.status(400).json({ success: false, message: `জমিটি ইতিমধ্যে ${record.status} অবস্থায় আছে।` });
    }

    record.status = 'Pending_Mutation';
    record.available_area_decimal = record.available_area_decimal - parseFloat(sold_area);
    record.last_updated = new Date();
    await record.save();

    return res.status(200).json({
      success: true,
      message: '🔒 Property Locked: জমির স্ট্যাটাস Pending_Mutation-এ পরিবর্তিত হয়েছে। Double-selling প্রতিরোধ সক্রিয়।',
      status: record.status
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/audit-log/:record_id - Get fraud alerts for a record
router.get('/audit-log/:record_id', async (req, res) => {
  try {
    const record = await LandRecord.findById(req.params.record_id).select('fraud_alerts mouza dag_no owner_name');
    if (!record) return res.status(404).json({ success: false, message: 'রেকর্ড পাওয়া যায়নি।' });
    return res.status(200).json({ success: true, fraud_alerts: record.fraud_alerts, record_info: { mouza: record.mouza, dag_no: record.dag_no, owner_name: record.owner_name } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
