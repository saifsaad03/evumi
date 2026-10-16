const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');
const User = require('../models/User');

// POST /api/verify-deed
// P3: Anti-Double Selling & Strict 3-Way Land Verification Engine (NID + Dag + Mouza)
router.post('/verify-deed', async (req, res) => {
  try {
    const { seller_nid, dag_no, mouza, jl_no, khatian_no, requested_area } = req.body;

    const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
    const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

    const cleanDag = (dag_no || '').toString().trim();
    const engDag = toEnglishDigits(cleanDag);
    const bngDag = toBengaliDigits(cleanDag);
    const cleanMouza = (mouza || '').toString().trim();
    const cleanSellerNid = (seller_nid || '').toString().trim();
    const engSellerNid = toEnglishDigits(cleanSellerNid);
    const bngSellerNid = toBengaliDigits(cleanSellerNid);

    // Rule 7 (Strict 3-Way Matching): NID, Dag, and Mouza must all be evaluated together.
    // Searching or making decisions purely based on matching just Dag or Mouza is strictly prohibited.
    if (!cleanSellerNid || !cleanDag || !cleanMouza) {
      return res.status(400).json({
        success: false,
        message: 'অনুগ্রহ করে বিক্রেতার NID নম্বর, দাগ নম্বর এবং মৌজা — এই ৩টি তথ্যই প্রদান করুন (৩টি ফিল্ডই আবশ্যক)।'
      });
    }

    const dagConditions = [{ dag_no: cleanDag }, { dag_no: engDag }, { dag_no: bngDag }];
    const nidConditions = [{ owner_nid: cleanSellerNid }, { owner_nid: engSellerNid }, { owner_nid: bngSellerNid }];
    const userNidConditions = [{ nid: cleanSellerNid }, { nid: engSellerNid }, { nid: bngSellerNid }];

    // 1. Check if the searched NID exists in the system database
    const userInDb = await User.findOne({ $or: userNidConditions });
    const nidLandRecords = await LandRecord.find({ $or: nidConditions });
    const nidExistsInDb = !!userInDb || (nidLandRecords && nidLandRecords.length > 0);

    // Rule 1 (Random/Unregistered NID):
    // If a random NID (which does not exist in the database) is searched,
    // trigger "No Record" or state that the owner of this land is someone else, without revealing any real owner's data.
    if (!nidExistsInDb) {
      return res.status(200).json({
        success: false,
        alert_type: 'NOT_FOUND',
        message: '⚠️ কোনো রেকর্ড পাওয়া যায়নি: প্রদত্ত NID-এর কোনো নিবন্ধন ডেটাবেজে নেই এবং এই জমির মালিক অন্য কেউ।'
      });
    }

    // Rule 2 (NID with No Land):
    // If an NID exists in the database but no land is assigned to it, the system must say:
    // "এই NID-এ কোনো জমির তথ্য নাই।"
    if (!nidLandRecords || nidLandRecords.length === 0) {
      return res.status(200).json({
        success: false,
        alert_type: 'NOT_FOUND',
        message: 'এই NID-এ কোনো জমির তথ্য নাই।'
      });
    }

    // Rule 3 (Fraud Alert / Fake Owner):
    // If the NID matches in the DB, but the Dag or Mouza does not match:
    // The system must trigger: "Fraud Alert: Fake Owner!" (And under no circumstances should the real owner's details be leaked).
    const landForThisSeller = nidLandRecords.filter(r => {
      const mouzaMatch = r.mouza && r.mouza.trim().toLowerCase() === cleanMouza.toLowerCase();
      const rDag = (r.dag_no || '').toString().trim();
      const dagMatch = rDag === cleanDag || rDag === engDag || rDag === bngDag ||
                       toEnglishDigits(rDag) === engDag || toBengaliDigits(rDag) === bngDag;
      return mouzaMatch && dagMatch;
    });

    if (landForThisSeller.length === 0) {
      // Check if this plot exists to log fraud internally WITHOUT leaking any real owner details to client
      const plotRecords = await LandRecord.find({
        mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
        $or: dagConditions
      });
      if (plotRecords && plotRecords.length > 0) {
        const primaryRecord = plotRecords[0];
        primaryRecord.fraud_alerts = primaryRecord.fraud_alerts || [];
        primaryRecord.fraud_alerts.push({
          type: 'FAKE_OWNER',
          message: 'Fraud Alert: Fake Owner Detected',
          attempted_nid: cleanSellerNid
        });
        primaryRecord.last_updated = new Date();
        await primaryRecord.save();
      }

      return res.status(200).json({
        success: false,
        alert_type: 'FAKE_OWNER',
        message: '🚨 জালিয়াতি সতর্কতা (Fraud Alert: Fake Owner!): প্রদত্ত NID-এর সাথে এই দাগ বা মৌজার কোনো মালিকানা রেকর্ড মেলেনি। ভুয়া মালিক সনাক্ত হয়েছে!'
      });
    }

    // Rule 4 (Government Land Check):
    // If the land belongs to the government, designated alert applies.
    const matchingRecord = landForThisSeller[0];
    const isUnassigned = !matchingRecord.owner_nid ||
      matchingRecord.owner_nid === '1000000000000' ||
      matchingRecord.owner_nid === 'অনলাইনে রেকর্ড নেই' ||
      matchingRecord.owner_name === 'অনলাইনে অনিবন্ধিত' ||
      (matchingRecord.owner_name && matchingRecord.owner_name.includes('সরকার')) ||
      (matchingRecord.owner_name && matchingRecord.owner_name.includes('খাস'));

    if (isUnassigned) {
      return res.status(200).json({
        success: false,
        alert_type: 'UNASSIGNED_LAND',
        message: '🚫 সরকারি খাস জমি সতর্কতা: এটি ১নং সরকারি খাস খতিয়ানের জমি। ব্যক্তি মালিকানাধীন হস্তান্তর সম্পূর্ণ অবৈধ।'
      });
    }

    // Rule 5 (Legal Dispute / Stay Order):
    // If the searched Dag and Mouza have an active Mamla (Lawsuit) or Stay Order
    const legalNotice = await LegalStatus.findOne({ $or: dagConditions });
    if (legalNotice && (legalNotice.has_court_case || legalNotice.stay_order || legalNotice.is_khas)) {
      if (legalNotice.is_khas) {
        return res.status(200).json({
          success: false,
          alert_type: 'UNASSIGNED_LAND',
          message: `🚫 সরকারি খাস জমি: এটি ১নং সরকারি খাস খতিয়ানের জমি (${legalNotice.khas_reason || 'সরকারি খাস সম্পত্তি'})। ব্যক্তি মালিকানাধীন হস্তান্তর সম্পূর্ণ অবৈধ।`
        });
      }

      let caseMsg = '';
      if (legalNotice.stay_order) {
        caseMsg = `⛔ আদালতের স্থগিতাদেশ (Stay Order): এই জমিতে বিজ্ঞ আদালতের নিষেধাজ্ঞা / Stay Order বলবৎ রয়েছে! ${legalNotice.case_details ? `[মামলা/আদেশ: ${legalNotice.case_details}]` : ''}। জমিটি বিক্রি, হস্তান্তর বা ক্রেতার নামে দলিল সম্পাদন সম্পূর্ণ নিষিদ্ধ।`;
      } else {
        caseMsg = `⚖️ আদালতীয় মামলা সতর্কতা (Active Court Dispute): এই জমির ওপর আদালতে সক্রিয় দেওয়ানি মোকদ্দমা / স্বত্ব মামলা বিচারাধীন রয়েছে! ${legalNotice.case_details ? `[মামলার বিবরণ: ${legalNotice.case_details}]` : ''}। মামলা নিষ্পত্তি না হওয়া পর্যন্ত জমিটি অনিরাপদ এবং বিক্রয়যোগ্য নয়।`;
      }

      return res.status(200).json({
        success: false,
        alert_type: 'COURT_CASE_STAY_ORDER',
        message: caseMsg,
        court_case: {
          has_court_case: !!legalNotice.has_court_case,
          stay_order: !!legalNotice.stay_order,
          case_details: legalNotice.case_details || ''
        }
      });
    }

    // Rule 6 (Actual Double Selling) & Core Ownership Logic:
    // Old Owner: If land is sold, triggers Double Selling alert for old owner.
    // New Owner/Buyer: Shows Active, checked independently. New owner can resell (2nd stage).
    const activeRecordForSeller = landForThisSeller.find(r => r.status === 'Active');
    const pendingRecordForSeller = landForThisSeller.find(r => r.status === 'Pending_Mutation' || r.status === 'Pending_AC_Land_Review');
    const soldRecordForSeller = landForThisSeller.find(r => r.status === 'Sold');

    // Also check if ANY mutation is currently pending for this plot in the entire ledger
    const anyPendingOnPlot = await LandRecord.findOne({
      mouza: { $regex: new RegExp(`^${cleanMouza}$`, 'i') },
      $or: dagConditions,
      status: { $in: ['Pending_Mutation', 'Pending_AC_Land_Review'] }
    });

    if (pendingRecordForSeller || anyPendingOnPlot) {
      const pendingStatus = (pendingRecordForSeller || anyPendingOnPlot).status;
      return res.status(200).json({
        success: false,
        alert_type: 'DOUBLE_SELL',
        message: `🔴 ডাবল-সেলিং সতর্কতা (Double-Selling Alert): এই জমির একটি দলিল বা নামজারি প্রক্রিয়া বর্তমানে চলমান (${pendingStatus})! জমিটি লক আছে, নতুন দলিল করা যাবে না।`,
        status: pendingStatus
      });
    }

    if (soldRecordForSeller && !activeRecordForSeller) {
      return res.status(200).json({
        success: false,
        alert_type: 'ALREADY_SOLD',
        message: '🔴 ডাবল-সেলিং সতর্কতা (Double-Selling Alert): আপনি (পুরোনো মালিক) ইতিমধ্যে এই জমিটি বিক্রয় ও হস্তান্তর সম্পন্ন করেছেন (Status: Sold)। পুরোনো মালিক হিসেবে পুনরায় বিক্রয় করা সম্ভব নয়।',
        status: 'Sold'
      });
    }

    if (!activeRecordForSeller) {
      return res.status(200).json({
        success: false,
        alert_type: 'NOT_FOUND',
        message: '⚠️ এই দাগ ও মৌজায় আপনার কোনো সক্রিয় মালিকানা রেকর্ড পাওয়া যায়নি।'
      });
    }

    // Step 2: Land Volume Check
    const reqArea = parseFloat(requested_area) || 0;
    if (reqArea > 0 && reqArea > activeRecordForSeller.available_area_decimal) {
      return res.status(200).json({
        success: false,
        alert_type: 'INSUFFICIENT_AREA',
        message: `⚠️ Error: Insufficient Land Volume! বিক্রয়যোগ্য জমি ${activeRecordForSeller.available_area_decimal} শতক, কিন্তু আবেদন করা হয়েছে ${reqArea} শতক।`,
        available_area: activeRecordForSeller.available_area_decimal
      });
    }

    // All checks passed!
    return res.status(200).json({
      success: true,
      alert_type: 'VERIFIED',
      message: '✅ Verified: বিক্রেতার মালিকানা ও জমির পরিমাণ যাচাই সম্পন্ন। দলিল অনুমোদনের জন্য প্রস্তুত।',
      record: {
        _id: activeRecordForSeller._id,
        mouza: activeRecordForSeller.mouza,
        jl_no: activeRecordForSeller.jl_no,
        khatian_no: activeRecordForSeller.khatian_no,
        dag_no: activeRecordForSeller.dag_no,
        owner_name: activeRecordForSeller.owner_name,
        owner_nid: activeRecordForSeller.owner_nid,
        available_area_decimal: activeRecordForSeller.available_area_decimal,
        total_area_decimal: activeRecordForSeller.total_area_decimal,
        status: activeRecordForSeller.status
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
