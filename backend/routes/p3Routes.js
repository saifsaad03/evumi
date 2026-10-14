const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');

// POST /api/verify-deed
// P3: Step 1 & 2 - Seller NID check + Land Volume check
router.post('/verify-deed', async (req, res) => {
  try {
    const { seller_nid, dag_no, mouza, jl_no, khatian_no, requested_area } = req.body;

    if (!seller_nid || !dag_no || !mouza || !requested_area) {
      return res.status(400).json({ success: false, message: 'সকল তথ্য প্রদান করুন।' });
    }

    // Find the Active record for this land
    const record = await LandRecord.findOne({
      dag_no,
      mouza,
      status: 'Active'
    });

    if (!record) {
      // Check if it's Pending or Sold
      const lockedRecord = await LandRecord.findOne({ dag_no, mouza });
      if (lockedRecord && lockedRecord.status === 'Pending_Mutation') {
        return res.status(200).json({
          success: false,
          alert_type: 'DOUBLE_SELL',
          message: '🔴 Double-Selling Alert: এই জমির একটি হস্তান্তর প্রক্রিয়া বর্তমানে চলমান! জমিটি Pending Mutation অবস্থায় আছে।',
          status: 'Pending_Mutation'
        });
      }
      if (lockedRecord && lockedRecord.status === 'Sold') {
        return res.status(200).json({
          success: false,
          alert_type: 'ALREADY_SOLD',
          message: '🔴 Error: এই জমি ইতিমধ্যে হস্তান্তর সম্পন্ন হয়েছে।',
          status: 'Sold'
        });
      }
      return res.status(404).json({
        success: false,
        alert_type: 'NOT_FOUND',
        message: '🔴 জমির রেকর্ড পাওয়া যায়নি।'
      });
    }

    // Step 1: Seller NID Verification
    if (record.owner_nid !== seller_nid) {
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
