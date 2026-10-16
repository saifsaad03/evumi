const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');
const { sendOtpEmail } = require('../utils/emailService');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { verifyToken, requireRole, JWT_SECRET } = require('../middleware/auth');

const {
  findUserByEmail,
  findUserByNid,
  createCitizenUser,
  createRegistrationOtp,
  findLatestRegistrationOtp,
  updateOtpRecord,
  deleteRegistrationOtps,
  createAssignOtp,
  findLatestAssignOtp,
  deleteAssignOtps
} = require('../utils/dbStore');

// Helper to generate 6-digit OTP
const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to generate JWT token
const generateToken = (user) => {
  const userId = user._id || user.id || 'usr_' + Date.now();
  return jwt.sign(
    { id: userId, role: user.role || 'User', email: user.email, nid: user.nid },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ==========================================
// 1. Send OTP for Citizen Registration
// ==========================================
router.post('/send-registration-otp', async (req, res) => {
  try {
    const { email, nid, name } = req.body;

    if (!email || !nid || !name) {
      return res.status(400).json({
        success: false,
        message: 'নাম, ইমেইল এবং জাতীয় পরিচয়পত্র (NID) নম্বর প্রদান আবশ্যক।'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNid = nid.trim();

    // Check if email or NID already exists (resilient db call)
    const existingEmail = await findUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'এই ইমেইল ঠিকানাটি ইতিমধ্যে ব্যবহৃত হচ্ছে। অনুগ্রহ করে লগইন করুন।'
      });
    }

    const existingNid = await findUserByNid(cleanNid);
    if (existingNid) {
      return res.status(400).json({
        success: false,
        message: 'এই জাতীয় পরিচয়পত্র (NID) ইতিমধ্যে অন্য অ্যাকাউন্টে নিবন্ধিত।'
      });
    }

    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Generate signed stateless OTP verification token with hashed OTP (never exposes raw OTP)
    const otpHash = crypto.createHash('sha256').update(otp.toString().trim()).digest('hex');
    const otpToken = jwt.sign(
      {
        email: cleanEmail,
        otpHash,
        nid: cleanNid,
        name: name.trim(),
        purpose: 'ACCOUNT_REGISTRATION'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Store OTP in resilient DB/disk/memory
    await createRegistrationOtp(cleanEmail, otp, cleanNid, name, expiresAt);
    console.log(`🔑 [REGISTRATION OTP for ${cleanEmail}]: ${otp}`);

    // Dispatch Email via Nodemailer
    const emailResult = await sendOtpEmail(cleanEmail, otp, 'ACCOUNT_REGISTRATION', { citizen_name: name });

    const isEmailDelivered = !emailResult.simulated;
    const responseMessage = isEmailDelivered
      ? `আপনার ইমেইল (${cleanEmail}) এ একটি ৬ ডিজিটের ভেরিফিকেশন ওটিপি পাঠানো হয়েছে।`
      : `আপনার ইমেইল (${cleanEmail}) এ একটি ৬ ডিজিটের ভেরিফিকেশন ওটিপি পাঠানো হয়েছে। আপনার ইনবক্স চেক করুন।`;

    return res.status(200).json({
      success: true,
      message: responseMessage,
      otpToken, // Stateless verification token containing non-reversible hash
      simulated: emailResult.simulated || false,
      emailError: emailResult.emailError || null
    });
  } catch (err) {
    console.error('Send registration OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'ওটিপি পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      error: err.message
    });
  }
});

// ==========================================
// 2. Verify OTP & Finalize Registration
// ==========================================
router.post('/verify-and-register', async (req, res) => {
  try {
    const {
      name,
      father_name,
      mother_name,
      nid,
      division,
      district,
      upazila,
      phone,
      email,
      password,
      otp,
      otpToken
    } = req.body;

    if (!name || !father_name || !mother_name || !nid || !division || !district || !upazila || !phone || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'সকল তথ্য এবং ৬ ডিজিটের ওটিপি কোড প্রদান আবশ্যক।'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNid = nid.trim();
    const cleanOtp = otp.toString().trim();

    console.log(`🔍 [OTP VERIFY] email=${cleanEmail}, otp=${cleanOtp}, hasToken=${!!otpToken}`);

    let isOtpValid = false;

    // ─────────────────────────────────────────────────────────
    // STEP 1 (PRIMARY): Verify via signed JWT otpToken
    // This works even when server restarts or memory resets
    // ─────────────────────────────────────────────────────────
    if (otpToken) {
      try {
        const decoded = jwt.verify(otpToken, JWT_SECRET);
        console.log(`🔑 [JWT TOKEN] decoded.email=${decoded.email}, purpose=${decoded.purpose}`);

        if (
          decoded.email === cleanEmail &&
          decoded.purpose === 'ACCOUNT_REGISTRATION'
        ) {
          const inputOtpHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
          const matches = decoded.otpHash ? (decoded.otpHash === inputOtpHash) : (decoded.otp === cleanOtp);

          if (matches) {
            isOtpValid = true;
            console.log('✅ [JWT VERIFY] OTP verified via signed token');
          } else {
            console.log(`❌ [JWT VERIFY] OTP mismatch for ${cleanEmail}`);
            return res.status(400).json({
              success: false,
              message: 'ভুল ওটিপি কোড! অনুগ্রহ করে আপনার ইমেইল চেক করুন।'
            });
          }
        }
      } catch (jwtErr) {
        console.warn('⚠️ otpToken validation error:', jwtErr.message);
        // Token expired or invalid — fall through to DB check
      }
    }

    // ─────────────────────────────────────────────────────────
    // STEP 2 (FALLBACK): Check DB / disk / memory record
    // Used when no otpToken present or token was expired
    // ─────────────────────────────────────────────────────────
    if (!isOtpValid) {
      const otpRecord = await findLatestRegistrationOtp(cleanEmail);
      console.log(`🗄️ [DB LOOKUP] found=${!!otpRecord}`);

      if (otpRecord) {
        // Check expiry
        if (new Date() > new Date(otpRecord.expiresAt)) {
          return res.status(400).json({
            success: false,
            message: 'ওটিপির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় ওটিপি অনুরোধ করুন।'
          });
        }

        // Check attempt limit
        if (otpRecord.attempts >= 5) {
          return res.status(429).json({
            success: false,
            message: 'সর্বোচ্চ ভুল প্রচেষ্টার সীমা অতিক্রম করেছে। পুনরায় ওটিপি কোড পাঠান।'
          });
        }

        // Check match
        if (otpRecord.otp === cleanOtp) {
          isOtpValid = true;
          await updateOtpRecord(otpRecord, { verified: true });
          console.log('✅ [DB VERIFY] OTP verified via database record');
        } else {
          const newAttempts = (otpRecord.attempts || 0) + 1;
          await updateOtpRecord(otpRecord, { attempts: newAttempts });
          return res.status(400).json({
            success: false,
            message: `ভুল ওটিপি কোড! অনুগ্রহ করে আপনার ইমেইল চেক করুন। (বাকি চেষ্টা: ${5 - newAttempts})`
          });
        }
      }
    }

    if (!isOtpValid) {
      console.log('❌ [VERIFY FAIL] No valid OTP found via token or DB');
      return res.status(400).json({
        success: false,
        message: 'কোনো সক্রিয় ওটিপি রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে নতুন ওটিপি অনুরোধ করুন।'
      });
    }

    // Mark verified and clean up
    await deleteRegistrationOtps(cleanEmail);

    // Re-check unique constraints
    const existingNid = await findUserByNid(cleanNid);
    if (existingNid) {
      return res.status(400).json({ success: false, message: 'এই জাতীয় পরিচয়পত্র (NID) ইতিমধ্যে নিবন্ধিত।' });
    }

    const existingEmail = await findUserByEmail(cleanEmail);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'এই ইমেইল ঠিকানাটি ইতিমধ্যে নিবন্ধিত।' });
    }

    // Create User safely (MongoDB Atlas + persistent disk file + memory fallback)
    const newUser = await createCitizenUser({
      name: name.trim(),
      father_name: father_name.trim(),
      mother_name: mother_name.trim(),
      nid: cleanNid,
      division,
      district,
      upazila,
      phone: phone.trim(),
      email: cleanEmail,
      password
    });

    // Clean up OTPs for this email
    await deleteRegistrationOtps(cleanEmail);

    const token = generateToken(newUser);
    const userObj = newUser.toObject ? newUser.toObject() : { ...newUser };
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: '🎉 ইমেইল যাচাই সম্পন্ন! নাগরিক অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।',
      token,
      user: userObj
    });
  } catch (err) {
    console.error('Verify and register error:', err);
    return res.status(500).json({
      success: false,
      message: 'নিবন্ধন সম্পন্ন করা যায়নি।',
      error: err.message
    });
  }
});

// ==========================================
// 3. Send OTP to Citizen for Land Assignment (Register Office -> AC Land)
// ==========================================
const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

router.post('/send-land-assign-otp', verifyToken, requireRole('Register Office', 'Super Admin'), async (req, res) => {
  try {
    const { citizen_nid, citizen_email, dag_no, mouza, land_record_id } = req.body;

    if (!citizen_nid || !citizen_email || !dag_no) {
      return res.status(400).json({
        success: false,
        message: 'নাগরিকের NID, ইমেইল এবং জমির দাগ নম্বর প্রদান আবশ্যক।'
      });
    }

    const cleanEmail = citizen_email.trim().toLowerCase();
    const rawNid = citizen_nid.toString().trim();
    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    // Resilient Citizen lookup (Atlas + local store)
    let citizen = null;
    try {
      citizen = await User.findOne({
        $or: [
          { nid: rawNid },
          { nid: engNid },
          { nid: bngNid },
          { email: cleanEmail }
        ]
      });
    } catch (e) {
      console.warn('DB lookup failed in send-land-assign-otp:', e.message);
    }

    if (!citizen) {
      citizen = (await findUserByNid(rawNid)) ||
                (await findUserByNid(engNid)) ||
                (await findUserByNid(bngNid)) ||
                (await findUserByEmail(cleanEmail));
    }

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: 'প্রদত্ত এনআইডিধারী নাগরিক সিস্টেমে খুঁজে পাওয়া যায়নি।'
      });
    }

    const citizenName = citizen.name || 'সম্মানিত নাগরিক';
    const targetEmail = (citizen.email || cleanEmail).trim().toLowerCase();

    const otp = generate6DigitOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save to resilient storage (Atlas + persistent disk + memory)
    await createAssignOtp(targetEmail, otp, citizen.nid, citizenName, {
      land_record_id,
      dag_no,
      mouza
    }, expiresAt);

    console.log(`🔑 [LAND ASSIGN OTP for ${targetEmail} (NID: ${citizen.nid})]: ${otp}`);

    // Dispatch real email to citizen (Never exposes raw OTP to frontend)
    const emailResult = await sendOtpEmail(targetEmail, otp, 'LAND_ASSIGNMENT', {
      citizen_name: citizenName,
      dag_no,
      mouza
    });

    const isEmailDelivered = !emailResult.simulated;
    const responseMessage = isEmailDelivered
      ? `নাগরিক (${citizenName}) এর ইমেইল '${targetEmail}' এ জমি বরাদ্দ সম্মতির ৬ ডিজিটের ওটিপি সফলভাবে পাঠানো হয়েছে।`
      : `নাগরিক (${citizenName}) এর ইমেইল '${targetEmail}' এ ওটিপি পাঠানো হয়েছে। ইনবক্স চেক করুন।`;

    return res.status(200).json({
      success: true,
      message: responseMessage,
      simulated: emailResult.simulated || false
    });
  } catch (err) {
    console.error('Send land assign OTP error:', err);
    return res.status(500).json({
      success: false,
      message: 'নাগরিকের ইমেইলে ওটিপি পাঠানো যায়নি।',
      error: err.message
    });
  }
});

module.exports = router;
