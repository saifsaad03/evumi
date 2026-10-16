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

    const cleanDag = (dag_no || '').toString().trim();
    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);
    const cleanMouza = (mouza || '').toString().trim();
    const cleanSellerNid = (seller_nid || '').toString().trim();
    const engSellerNid = toEnglishDigits(cleanSellerNid);
    const bngSellerNid = toBengaliDigits(cleanSellerNid);

    const dagConditions = [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }];

    // Fetch all records for this plot (both active, sold, and pending in history)
    const allPlotRecords = await LandRecord.find({
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: dagConditions
    }).sort({ updatedAt: -1, createdAt: -1 });

    if (!allPlotRecords || allPlotRecords.length === 0) {
      return res.status(200).json({
        success: false,
        alert_type: 'NOT_FOUND',
        message: '⚠️ এই দাগ ও মৌজায় নিবন্ধিত কোনো জমির রেকর্ড পাওয়া যায়নি (ডাটাবেজে জমিটি অস্তিত্বহীন বা বরাদ্দপ্রাপ্ত নয়)।'
      });
    }

    // Check Super Admin Legal Notice / Court Case / Stay Order
    const legalNotice = await LegalStatus.findOne({ $or: dagConditions });

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

    let record = null;

    if (cleanSellerNid) {
      // 1. Check if the specified seller has an Active record for this plot
      const activeRecordForSeller = allPlotRecords.find(r =>
        (toEnglishDigits(r.owner_nid) === engSellerNid || toBengaliDigits(r.owner_nid) === bngSellerNid) &&
        r.status === 'Active'
      );

      // 2. Check if the specified seller has a pending record
      const pendingRecordForSeller = allPlotRecords.find(r =>
        (toEnglishDigits(r.owner_nid) === engSellerNid || toBengaliDigits(r.owner_nid) === bngSellerNid) &&
        (r.status === 'Pending_Mutation' || r.status === 'Pending_AC_Land_Review')
      );

      // 3. Check if the specified seller previously sold this land
      const soldRecordForSeller = allPlotRecords.find(r =>
        (toEnglishDigits(r.owner_nid) === engSellerNid || toBengaliDigits(r.owner_nid) === bngSellerNid) &&
        r.status === 'Sold'
      );

      if (activeRecordForSeller) {
        // Current valid owner selling their active land
        record = activeRecordForSeller;
      } else if (pendingRecordForSeller) {
        return res.status(200).json({
          success: false,
          alert_type: 'DOUBLE_SELL',
          message: `🔴 ডাবল-সেলিং সতর্কতা (Double-Selling Alert): এই জমির একটি দলিল বা নামজারি প্রক্রিয়া বর্তমানে চলমান (${pendingRecordForSeller.status})! জমিটি লক আছে, নতুন দলিল করা যাবে না।`,
          status: pendingRecordForSeller.status
        });
      } else if (soldRecordForSeller) {
        // Old owner trying to sell land they already sold!
        return res.status(200).json({
          success: false,
          alert_type: 'ALREADY_SOLD',
          message: '🔴 ডাবল-সেলিং সতর্কতা (Double-Selling Alert): আপনি (পুরোনো মালিক) ইতিমধ্যে এই জমিটি বিক্রয় ও হস্তান্তর সম্পন্ন করেছেন (Status: Sold)। পুরোনো মালিক হিসেবে পুনরায় বিক্রয় করা সম্ভব নয়।',
          status: 'Sold'
        });
      } else {
        // Seller NID is not found in any record for this plot
        const currentActive = allPlotRecords.find(r => r.status === 'Active');
        if (currentActive) {
          // Log fraud alert
          currentActive.fraud_alerts = currentActive.fraud_alerts || [];
          currentActive.fraud_alerts.push({
            type: 'FAKE_OWNER',
            message: 'Fraud Alert: Fake Owner Detected',
            attempted_nid: cleanSellerNid
          });
          currentActive.last_updated = new Date();
          await currentActive.save();

          return res.status(200).json({
            success: false,
            alert_type: 'FAKE_OWNER',
            message: `🚨 জালিয়াতি সতর্কতা (Fraud Alert): বিক্রেতার এনআইডি (${cleanSellerNid}) বর্তমান প্রকৃত জমির মালিকের এনআইডি (${currentActive.owner_nid})-এর সাথে মেলেনি। ভুয়া মালিক সনাক্ত হয়েছে!`,
            record_owner: currentActive.owner_name
          });
        }

        const anyPending = allPlotRecords.find(r => r.status === 'Pending_Mutation' || r.status === 'Pending_AC_Land_Review');
        if (anyPending) {
          return res.status(200).json({
            success: false,
            alert_type: 'DOUBLE_SELL',
            message: `🔴 ডাবল-সেলিং সতর্কতা: এই জমির একটি হস্তান্তর প্রক্রিয়া বর্তমানে চলমান (${anyPending.status})!`,
            status: anyPending.status
          });
        }

        return res.status(200).json({
          success: false,
          alert_type: 'ALREADY_SOLD',
          message: '🔴 এই দাগ ও মৌজার জমির মালিকানা হস্তান্তর সম্পন্ন হয়েছে (Status: Sold)। বর্তমানে কোনো সক্রিয় মালিকানা রেকর্ড নেই।',
          status: 'Sold'
        });
      }
    } else {
      // No seller NID provided (e.g. general public verification)
      // Prioritize Active record, then Pending, then Sold
      record = allPlotRecords.find(r => r.status === 'Active') ||
               allPlotRecords.find(r => r.status === 'Pending_Mutation' || r.status === 'Pending_AC_Land_Review') ||
               allPlotRecords[0];

      if (record.status === 'Pending_Mutation' || record.status === 'Pending_AC_Land_Review') {
        return res.status(200).json({
          success: false,
          alert_type: 'DOUBLE_SELL',
          message: `🔴 ডাবল-সেলিং সতর্কতা (Double-Selling Alert): এই জমির একটি দলিল বা নামজারি প্রক্রিয়া বর্তমানে চলমান (${record.status})!`,
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

    // Step 2: Land Volume Check
    const reqArea = parseFloat(requested_area) || 0;
    if (reqArea > 0 && reqArea > record.available_area_decimal) {
      return res.status(200).json({
        success: false,
        alert_type: 'INSUFFICIENT_AREA',
        message: `⚠️ Error: Insufficient Land Volume! বিক্রয়যোগ্য জমি ${record.available_area_decimal} শতক, কিন্তু আবেদন করা হয়েছে ${reqArea} শতক।`,
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
