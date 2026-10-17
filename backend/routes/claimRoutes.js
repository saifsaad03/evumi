const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const LandClaimApplication = require('../models/LandClaimApplication');
const { verifyToken } = require('../middleware/auth');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CLAIMS_FILE = path.join(DATA_DIR, 'claims.json');

// Ensure claims file exists
const loadClaimsFromFile = () => {
  try {
    if (fs.existsSync(CLAIMS_FILE)) {
      const data = fs.readFileSync(CLAIMS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not read claims.json:', err.message);
  }
  return [];
};

const saveClaimsToFile = (claims) => {
  try {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not write claims.json:', err.message);
  }
};

if (!global._memoryClaims) {
  global._memoryClaims = loadClaimsFromFile();
}

const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

/**
 * POST /api/claim/submit
 * Citizen submits a new land ownership claim application
 */
router.post('/submit', verifyToken, async (req, res) => {
  try {
    const {
      mouza,
      dag_no,
      khatian_no,
      previous_assignment_status,
      declaration_text
    } = req.body;

    if (!mouza || !dag_no || !khatian_no || !previous_assignment_status) {
      return res.status(400).json({
        success: false,
        message: 'দয়া করে মৌজা, দাগ নম্বর, খতিয়ান নম্বর এবং পূর্ববর্তী অ্যাসাইন সংক্রান্ত তথ্য প্রদান করুন।'
      });
    }

    const applicant_name = req.user.name || 'নাগরিক';
    const applicant_nid = req.user.nid || '';
    const applicant_phone = req.user.phone || '';
    const applicant_email = req.user.email || '';
    const user_id = req.user._id && mongoose.Types.ObjectId.isValid(req.user._id) ? req.user._id : null;

    // Auto-generate declaration text if not provided
    const finalDeclaration = declaration_text || 
      `আমি ${applicant_name}, NID: ${applicant_nid} দাবি করছি যে, বগুড়া জেলা, শিবগঞ্জ উপজেলার অন্তর্গত মৌজা: ${mouza}, দাগ নম্বর: ${dag_no}, খতিয়ান নম্বর: ${khatian_no} এ থাকা জমির অনলাইন মালিকানা দাবি করছি। বর্তমানে আমি জমিটি ডিজিটাল ভাবে নিবন্ধন/বিক্রি করতে চাই। তাই সাব রেজিস্ট্রার মহোদয় এর কাছে আবেদন ভেরিফাই করে জমিটি আমার নামে অনলাইনে বরদ্দ দিন।`;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const claim_id = `CLM-${Date.now().toString().slice(-6)}-${randomSuffix}`;

    const claimDoc = {
      claim_id,
      applicant_name,
      applicant_nid,
      applicant_phone,
      applicant_email,
      user_id,
      division: 'রাজশাহী',
      district: 'বগুড়া',
      upazila: 'শিবগঞ্জ',
      mouza: mouza.trim(),
      dag_no: dag_no.trim(),
      khatian_no: khatian_no.trim(),
      previous_assignment_status: previous_assignment_status.trim(),
      declaration_text: finalDeclaration,
      status: 'Pending_Review',
      status_label: 'বিজ্ঞপ্তি প্রেরিত (অবহিতকরণ)',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let savedItem = null;

    // Try MongoDB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const newClaim = new LandClaimApplication(claimDoc);
        savedItem = await newClaim.save();
      } catch (dbErr) {
        console.warn('⚠️ MongoDB save failed, falling back to disk store:', dbErr.message);
      }
    }

    // Always update disk and memory cache for resiliency
    const diskItem = savedItem ? savedItem.toObject() : { ...claimDoc, _id: claim_id };
    global._memoryClaims.unshift(diskItem);
    saveClaimsToFile(global._memoryClaims);

    return res.status(201).json({
      success: true,
      message: 'আপনার জমি মালিকানা দাবির আবেদনটি সফলভাবে সাব-রেজিস্ট্রার কার্যালয়ে প্রেরিত হয়েছে।',
      data: diskItem
    });
  } catch (err) {
    console.error('Error submitting land claim:', err);
    return res.status(500).json({
      success: false,
      message: 'আবেদন দাখিল করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
    });
  }
});

/**
 * GET /api/claim/my-claims
 * Returns claims submitted by the currently logged-in citizen
 */
router.get('/my-claims', verifyToken, async (req, res) => {
  try {
    const rawNid = req.user.nid || '';
    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    let claims = [];

    // Check MongoDB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        claims = await LandClaimApplication.find({
          $or: [
            { applicant_nid: rawNid },
            { applicant_nid: engNid },
            { applicant_nid: bngNid }
          ]
        }).sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('MongoDB my-claims query failed:', dbErr.message);
      }
    }

    // Fallback/Merge with memory store
    if (!claims || claims.length === 0) {
      claims = (global._memoryClaims || []).filter(c => 
        c.applicant_nid === rawNid || 
        c.applicant_nid === engNid || 
        c.applicant_nid === bngNid
      );
    }

    return res.status(200).json({
      success: true,
      data: claims
    });
  } catch (err) {
    console.error('Error fetching my claims:', err);
    return res.status(500).json({
      success: false,
      message: 'আপনার দাবির তালিকা লোড করতে ব্যর্থ হয়েছে।'
    });
  }
});

/**
 * GET /api/claim/all
 * Read-only notifications/applications for Sub-Registrar
 */
router.get('/all', verifyToken, async (req, res) => {
  try {
    let claims = [];

    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        claims = await LandClaimApplication.find().sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('MongoDB all claims query failed:', dbErr.message);
      }
    }

    if (!claims || claims.length === 0) {
      claims = global._memoryClaims || loadClaimsFromFile();
    }

    return res.status(200).json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (err) {
    console.error('Error fetching all claims:', err);
    return res.status(500).json({
      success: false,
      message: 'দাবি বিজ্ঞপ্তিসমূহ লোড করতে ব্যর্থ হয়েছে।'
    });
  }
});

module.exports = router;
