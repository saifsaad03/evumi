const express = require('express');
const router = express.Router();
const LandRecord = require('../models/LandRecord');
const LegalStatus = require('../models/LegalStatus');

// GET /api/verify-land?mouza=X&dag=Y&khatian=Z
// P5: Public read-only land verification with traffic light system
router.get('/verify-land', async (req, res) => {
  try {
    const { mouza, dag_no, khatian_no, jl_no, division, district, upazila } = req.query;

    if (!dag_no && !khatian_no) {
      return res.status(400).json({ success: false, message: 'দাগ নম্বর বা খতিয়ান নম্বর প্রদান করুন।' });
    }

    // Build query
    const query = {};
    if (division) query.division = division;
    if (district) query.district = district;
    if (upazila) query.upazila = upazila;
    if (mouza) query.mouza = { $regex: mouza, $options: 'i' };
    if (dag_no) query.dag_no = dag_no;
    if (khatian_no) query.khatian_no = khatian_no;
    if (jl_no) query.jl_no = jl_no;

    // Find the most recent record
    const record = await LandRecord.findOne(query).sort({ createdAt: -1 });

    if (!record) {
      return res.status(200).json({
        success: false,
        signal: 'unknown',
        message: 'এই জমির কোনো রেকর্ড পাওয়া যায়নি।',
        data: null
      });
    }

    // Check legal status
    const legalStatus = await LegalStatus.findOne({ dag_no: record.dag_no });

    // Mask NID: show first 7 digits then ****
    const maskedNid = record.owner_nid
      ? record.owner_nid.substring(0, 7) + '****'
      : 'N/A';

    // Traffic Light Logic
    // RED: Legal issue (khas / court case)
    if (legalStatus && (legalStatus.is_khas || legalStatus.has_court_case || legalStatus.stay_order)) {
      let redMessage = '';
      if (legalStatus.is_khas) redMessage = `🚫 সতর্কতা: এটি সরকারি খাস জমি! কারণ: ${legalStatus.khas_reason || 'সরকারি সম্পত্তি'}। এই জমি ক্রয় করা আইনত নিষিদ্ধ।`;
      else if (legalStatus.stay_order) redMessage = `⛔ সতর্কতা: এই জমিতে আদালতের Stay Order রয়েছে! ${legalStatus.case_details || ''}`;
      else redMessage = `⚖️ সতর্কতা: এই জমিতে সক্রিয় আদালতীয় মামলা রয়েছে! ${legalStatus.case_details || ''}`;

      return res.status(200).json({
        success: true,
        signal: 'danger',
        message: redMessage,
        data: {
          division: record.division || 'রাজশাহী',
          district: record.district || 'বগুড়া',
          upazila: record.upazila || 'শিবগঞ্জ',
          mouza: record.mouza,
          jl_no: record.jl_no,
          khatian_no: record.khatian_no,
          dag_no: record.dag_no,
          owner_name: record.owner_name.charAt(0) + '***',
          owner_nid: maskedNid,
          total_area_decimal: record.total_area_decimal,
          status: record.status,
          legal: {
            is_khas: legalStatus?.is_khas || false,
            has_court_case: legalStatus?.has_court_case || false,
            stay_order: legalStatus?.stay_order || false,
            case_details: legalStatus?.case_details || null
          }
        }
      });
    }

    // RED: Pending_Mutation (transaction in progress = double-sell risk)
    if (record.status === 'Pending_Mutation') {
      return res.status(200).json({
        success: true,
        signal: 'warning',
        message: '🟡 সতর্কতা: এই জমির একটি হস্তান্তর প্রক্রিয়া বর্তমানে চলমান! নামজারি প্রক্রিয়াধীন আছে। এই মুহূর্তে ক্রয় করা ঝুঁকিপূর্ণ।',
        data: {
          division: record.division || 'রাজশাহী',
          district: record.district || 'বগুড়া',
          upazila: record.upazila || 'শিবগঞ্জ',
          mouza: record.mouza,
          jl_no: record.jl_no,
          khatian_no: record.khatian_no,
          dag_no: record.dag_no,
          owner_name: record.owner_name.charAt(0) + '***',
          owner_nid: maskedNid,
          total_area_decimal: record.total_area_decimal,
          status: record.status,
          legal: { is_khas: false, has_court_case: false }
        }
      });
    }

    // RED: Already Sold
    if (record.status === 'Sold') {
      return res.status(200).json({
        success: true,
        signal: 'danger',
        message: '🔴 এই জমির মালিকানা হস্তান্তর ইতিমধ্যে সম্পন্ন হয়েছে। বিক্রেতা যদি এই জমি বিক্রি করতে চান তাহলে সেটি জালিয়াতি হবে।',
        data: {
          division: record.division || 'রাজশাহী',
          district: record.district || 'বগুড়া',
          upazila: record.upazila || 'শিবগঞ্জ',
          mouza: record.mouza,
          jl_no: record.jl_no,
          khatian_no: record.khatian_no,
          dag_no: record.dag_no,
          owner_name: '***',
          owner_nid: '***',
          total_area_decimal: record.total_area_decimal,
          status: record.status,
          legal: { is_khas: false, has_court_case: false }
        }
      });
    }

    // GREEN: Active, no issues
    return res.status(200).json({
      success: true,
      signal: 'safe',
      message: '✅ নিরাপদ: এই জমির রেকর্ড সক্রিয় এবং কোনো মামলা বা বিরোধ নেই। জমি ক্রয় করা নিরাপদ।',
      data: {
        division: record.division || 'রাজশাহী',
        district: record.district || 'বগুড়া',
        upazila: record.upazila || 'শিবগঞ্জ',
        mouza: record.mouza,
        jl_no: record.jl_no,
        khatian_no: record.khatian_no,
        dag_no: record.dag_no,
        owner_name: record.owner_name.charAt(0) + record.owner_name.substring(1, 3) + '***',
        owner_nid: maskedNid,
        total_area_decimal: record.total_area_decimal,
        available_area_decimal: record.available_area_decimal,
        status: record.status,
        last_updated: record.last_updated,
        legal: { is_khas: false, has_court_case: false }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// GET /api/verify-by-qr/:qr_code_id - QR Code scan verification
router.get('/verify-by-qr/:qr_code_id', async (req, res) => {
  try {
    const rawCode = (req.params.qr_code_id || '').trim();
    const mongoose = require('mongoose');
    const queryConditions = [
      { qr_code_id: rawCode },
      { record_id: rawCode },
      { deed_hash: rawCode }
    ];
    if (mongoose.Types.ObjectId.isValid(rawCode)) {
      queryConditions.push({ _id: rawCode });
    }

    const record = await LandRecord.findOne({ $or: queryConditions });
    if (!record) return res.status(404).json({ success: false, message: 'QR কোড যাচাই ব্যর্থ হয়েছে। ডেটাবেজে কোনো রেকর্ড পাওয়া যায়নি।' });

    return res.status(200).json({
      success: true,
      message: '✅ QR কোড যাচাই সম্পন্ন। খতিয়ান ও মালিকানা রেকর্ড সম্পূর্ণ বৈধ।',
      data: {
        mouza: record.mouza,
        jl_no: record.jl_no,
        khatian_no: record.khatian_no,
        dag_no: record.dag_no,
        owner_name: record.owner_name,
        owner_nid: record.owner_nid,
        division: record.division,
        district: record.district,
        upazila: record.upazila,
        total_area_decimal: record.total_area_decimal,
        available_area_decimal: record.available_area_decimal,
        volume_book: record.volume_book,
        page_no: record.page_no,
        deed_no: record.deed_no,
        status: record.status,
        deed_hash: record.deed_hash,
        qr_code_id: record.qr_code_id || rawCode,
        last_updated: record.last_updated || record.updatedAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
