const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LandRecord = require('../models/LandRecord');
const LandAssignRequest = require('../models/LandAssignRequest');
const OtherDeedApplication = require('../models/OtherDeedApplication');
const BontonnamaApplication = require('../models/BontonnamaApplication');
const { verifyToken } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLogger');

// GET /api/user/profile - Read user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'প্রোফাইল লোড করা সম্ভব হয়নি।' });
  }
});

// PUT /api/user/profile - User updates their own profile/account info
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { phone, email, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }

    const changedFields = [];
    const prevDetails = { phone: user.phone, email: user.email };

    if (phone && phone !== user.phone) {
      const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
      const cleanPhone = toEnglishDigits(phone.toString().trim());
      if (cleanPhone.length !== 11 || !/^\d{11}$/.test(cleanPhone)) {
        return res.status(400).json({
          success: false,
          message: 'মোবাইল নম্বর অবশ্যই ১১ ডিজিটের হতে হবে (এর কম বা বেশি গ্রহণযোগ্য নয়)।'
        });
      }
      changedFields.push(`মোবাইল নম্বর (${user.phone} ➔ ${cleanPhone})`);
      user.phone = cleanPhone;
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'এই ইমেইলটি অন্য একাউন্টে ব্যবহৃত হচ্ছে।' });
      }
      changedFields.push(`ইমেইল ঠিকানা (${user.email} ➔ ${email})`);
      user.email = email;
    }

    if (password && password.trim()) {
      user.password = password; // pre-save hook will hash
      changedFields.push('অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন');
    }

    if (changedFields.length === 0) {
      return res.status(200).json({ success: true, message: 'কোনো পরিবর্তন করা হয়নি।' });
    }

    await user.save();

    // Log User profile activity
    logActivity({
      req,
      action_type: 'USER_PROFILE_UPDATE',
      module: 'Profile',
      description: `নাগরিক ${user.name} তার প্রোফাইল পরিবর্তন করেছেন: ${changedFields.join(', ')}`,
      target_resource: `User: ${user.name} (NID: ${user.nid})`,
      details: {
        changedFields,
        previous: prevDetails,
        updated: { phone: user.phone, email: user.email }
      }
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: '✅ প্রোফাইল সফলভাবে আপডেট করা হয়েছে!',
      user: userObj
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।' });
  }
});

// GET /api/user/institutions-list
// Sub-Registrar & Admin fetches list of registered institutions
router.get('/institutions-list', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'Register Office' && req.user.role !== 'Super Admin') {
      return res.status(403).json({ success: false, message: 'অননুমোদিত প্রবেশাধিকার। শুধুমাত্র সাব-রেজিস্ট্রার ও এডমিন অ্যাক্সেস করতে পারেন।' });
    }
    const search = (req.query.search || '').trim();
    const query = { role: 'Institution' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nid: { $regex: search, $options: 'i' } },
        { representative_name: { $regex: search, $options: 'i' } }
      ];
    }
    const institutions = await User.find(query).select('-password').sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: institutions });
  } catch (err) {
    console.error('Fetch institutions list error:', err);
    return res.status(500).json({ success: false, message: 'প্রতিষ্ঠান তালিকা লোড করা যায়নি।' });
  }
});

// GET /api/user/institution-custody-history
// Returns custody history for an institution
router.get('/institution-custody-history', verifyToken, async (req, res) => {
  try {
    const institutionId = req.query.institution_id;
    let targetUser = null;
    if (institutionId && (req.user.role === 'Register Office' || req.user.role === 'Super Admin')) {
      targetUser = await User.findById(institutionId);
    } else {
      targetUser = await User.findById(req.user._id);
    }

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'প্রতিষ্ঠান ব্যবহারকারী খুঁজে পাওয়া যায়নি।' });
    }

    return res.status(200).json({
      success: true,
      institution_name: targetUser.name,
      representative_name: targetUser.representative_name,
      representative_designation: targetUser.representative_designation || 'মোতাওয়াল্লী / সভাপতি',
      custody_history: targetUser.custody_history || []
    });
  } catch (err) {
    console.error('Fetch custody history error:', err);
    return res.status(500).json({ success: false, message: 'ইতিহাস লোড করা যায়নি।' });
  }
});

// PUT /api/user/institution-custody
// EXCLUSIVE: Sub-Registrar (Register Office) or Super Admin updates institution name & mutawalli.
// Institution cannot change itself directly.
router.put('/institution-custody', verifyToken, async (req, res) => {
  try {
    // 1. Enforce Role: Institution cannot change itself; only Sub-Registrar or Super Admin can!
    if (req.user.role !== 'Register Office' && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'প্রতিষ্ঠান নিজে কোনো তথ্য পরিবর্তন করতে পারবে না। ওয়াকফ আইন অনুযায়ী শুধুমাত্র সাব-রেজিস্ট্রার (Sub-Registrar) বা মন্ত্রণালয় এডমিন এই পরিবর্তন সম্পাদন করতে পারেন।'
      });
    }

    const {
      institution_id,
      institution_nid,
      name,
      representative_name,
      representative_nid,
      representative_designation,
      reason,
      resolution_no,
      effective_date,
      phone,
      email
    } = req.body;

    const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
    const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

    let targetUser = null;
    if (institution_id) {
      targetUser = await User.findById(institution_id);
    } else if (institution_nid) {
      const cleanNid = institution_nid.trim();
      targetUser = await User.findOne({
        role: 'Institution',
        $or: [
          { nid: cleanNid },
          { nid: toEnglishDigits(cleanNid) },
          { nid: toBengaliDigits(cleanNid) }
        ]
      });
    }

    if (!targetUser || targetUser.role !== 'Institution') {
      return res.status(404).json({ success: false, message: 'সংশ্লিষ্ট ওয়াকফ / প্রতিষ্ঠান অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' });
    }

    const prevName = (targetUser.name || '').trim();
    const prevRep = (targetUser.representative_name || targetUser.father_name || '').trim();
    const prevRepNid = (targetUser.representative_nid || '').trim();
    const prevDesig = (targetUser.representative_designation || 'মোতাওয়াল্লী / সভাপতি').trim();

    const newName = (name && name.trim()) ? name.trim() : prevName;
    const newRep = (representative_name && representative_name.trim()) ? representative_name.trim() : prevRep;
    const newRepNid = (representative_nid && representative_nid.trim()) ? representative_nid.trim() : prevRepNid;
    const newDesig = (representative_designation && representative_designation.trim()) ? representative_designation.trim() : prevDesig;

    const isNameChanged = newName !== prevName;
    const isRepChanged = newRep !== prevRep;
    const isRepNidChanged = newRepNid !== prevRepNid;
    const isDesigChanged = newDesig !== prevDesig;

    if (!isNameChanged && !isRepChanged && !isRepNidChanged && !isDesigChanged && !phone && !email) {
      return res.status(400).json({ success: false, message: 'কোনো নতুন তথ্য প্রদান করা হয়নি।' });
    }

    // Determine changer title
    const officerName = req.user.name || 'সাব-রেজিস্ট্রার';
    const changerTitle = req.user.role === 'Super Admin' 
      ? `${officerName} (মন্ত্রণালয় এডমিন)`
      : `${officerName} (সাব-রেজিস্ট্রার)`;

    // Record immutable history log
    targetUser.custody_history = targetUser.custody_history || [];
    targetUser.custody_history.unshift({
      previous_name: prevName,
      new_name: newName,
      previous_representative: prevRep || 'প্রাথমিক প্রতিনিধি',
      previous_representative_nid: prevRepNid,
      new_representative: newRep,
      new_representative_nid: newRepNid,
      previous_designation: prevDesig,
      new_designation: newDesig,
      reason: reason || 'সাব-রেজিস্ট্রি অফিসে ওয়াকফ কমিটি ও মোতাওয়াল্লী রদবদল অনুমোদন',
      resolution_no: resolution_no || `SR-RES-${Date.now().toString().slice(-6)}`,
      effective_date: effective_date ? new Date(effective_date) : new Date(),
      changed_by: changerTitle,
      changed_by_role: req.user.role,
      created_at: new Date()
    });

    targetUser.name = newName;
    targetUser.representative_name = newRep;
    targetUser.representative_nid = newRepNid;
    targetUser.representative_designation = newDesig;

    if (phone && phone.trim()) {
      targetUser.phone = phone.trim();
    }
    if (email && email.trim()) {
      targetUser.email = email.trim().toLowerCase();
    }

    await targetUser.save();

    // If institution name changed, update the active LandRecords owner_name and log to land transfer_history
    if (isNameChanged) {
      try {
        await LandRecord.updateMany(
          { owner_nid: targetUser.nid },
          { 
            $set: { owner_name: newName },
            $push: {
              transfer_history: {
                title: 'ওয়াকফ প্রতিষ্ঠানের নাম ও মোতাওয়াল্লী পরিবর্তন (সাব-রেজিস্ট্রার কর্তৃক)',
                date: new Date(),
                details: `সাব-রেজিস্ট্রার (${changerTitle}) কর্তৃক নাম হালনাগাদ: '${prevName}' ➔ '${newName}' (মোতাওয়াল্লী: ${newRep})। রেজুলেশন: ${resolution_no || 'সরকারি অনুমোদন'}`,
                source_type: 'Institution_Custody_Update_SubRegistrar'
              }
            }
          }
        );
      } catch (landErr) {
        console.error('LandRecord sync warning:', landErr);
      }
    }

    // Log Activity to Audit Engine
    logActivity({
      req,
      action_type: 'INSTITUTION_CUSTODY_UPDATED_BY_SUB_REGISTRAR',
      module: 'Institution_Management',
      description: `সাব-রেজিস্ট্রার কর্তৃক প্রতিষ্ঠান '${prevName}' এর নাম/দায়িত্ব পরিবর্তন: নতুন নাম '${newName}', মোতাওয়াল্লী '${newRep}' (${newDesig})`,
      target_resource: `Institution ID: ${targetUser._id}, NID: ${targetUser.nid}`,
      details: {
        officer: changerTitle,
        previous: { name: prevName, representative: prevRep, designation: prevDesig },
        updated: { name: newName, representative: newRep, designation: newDesig, reason, resolution_no }
      }
    });

    const userObj = targetUser.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: `✅ সাব-রেজিস্ট্রার কর্তৃক '${newName}'-এর মোতাওয়াল্লী ও নাম সফলভাবে হালনাগাদ করা হয়েছে!`,
      user: userObj,
      custody_history: targetUser.custody_history
    });
  } catch (err) {
    console.error('Institution custody update error:', err);
    return res.status(500).json({ success: false, message: 'তথ্য হালনাগাদ ব্যর্থ হয়েছে: ' + err.message });
  }
});

// GET /api/user/assigned-lands
// Returns only the lands assigned to and owned by this specific citizen
router.get('/assigned-lands', verifyToken, async (req, res) => {
  try {
    const rawNid = (req.user?.nid || '').toString().trim();
    if (!rawNid) {
      return res.status(200).json({
        success: true,
        data: {
          active_lands: [],
          sold_lands: [],
          approved_assignments: [],
          pending_assignments: []
        }
      });
    }

    const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
    const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();
    const engNid = toEnglishDigits(rawNid);
    const bngNid = toBengaliDigits(rawNid);

    const nidConditions = [
      { owner_nid: rawNid },
      { owner_nid: engNid },
      { owner_nid: bngNid },
      { 'co_owners.nid': rawNid },
      { 'co_owners.nid': engNid },
      { 'co_owners.nid': bngNid },
      { 'buyers.nid': rawNid },
      { 'buyers.nid': engNid },
      { 'buyers.nid': bngNid },
      { 'bayna_details.bayna_buyer_nid': rawNid },
      { 'bayna_details.bayna_buyer_nid': engNid },
      { 'bayna_details.bayna_buyer_nid': bngNid },
      { 'mortgage_details.mortgagee_nid': rawNid },
      { 'mortgage_details.mortgagee_nid': engNid },
      { 'mortgage_details.mortgagee_nid': bngNid }
    ];

    const userNidConditions = [
      { user_nid: rawNid },
      { user_nid: engNid },
      { user_nid: bngNid }
    ];

    // 1. Strictly find land records owned by THIS citizen (Active, Deceased_Locked, Mortgage_Locked, Bayna_Locked, Pending mutations)
    // Never include government khas or unassigned plots
    const activeLands = await LandRecord.find({
      $and: [
        { $or: nidConditions },
        { owner_nid: { $nin: ['GOVT-KHAS-01', '1000000000000', 'অনলাইনে রেকর্ড নেই', ''] } },
        { owner_name: { $not: /সরকার|অনলাইনে অনিবন্ধিত/ } },
        { status: { $in: ['Active', 'Deceased_Locked', 'Mortgage_Locked', 'Bayna_Locked', 'Pending_Mutation', 'Pending_Heba_Review', 'Pending_Exchange_Review'] } }
      ]
    }).sort({ updatedAt: -1 });

    // 2. Find sold lands history for THIS citizen
    const soldLands = await LandRecord.find({
      $and: [
        { $or: nidConditions },
        { owner_nid: { $nin: ['GOVT-KHAS-01', '1000000000000', 'অনলাইনে রেকর্ড নেই', ''] } },
        { status: 'Sold' }
      ]
    }).sort({ updatedAt: -1 });

    // 3. Find approved assignment history for THIS citizen
    const approvedAssignments = await LandAssignRequest.find({
      $or: userNidConditions,
      status: 'Approved'
    }).sort({ updatedAt: -1 });

    // 4. Find pending assignment requests for THIS citizen
    const pendingAssignments = await LandAssignRequest.find({
      $or: userNidConditions,
      status: 'Pending_AC_Land_Review'
    }).sort({ createdAt: -1 });

    // 5. Find pending Other Deed mutations (Heba & Exchange) for THIS citizen
    let pendingOtherDeeds = [];
    try {
      pendingOtherDeeds = await OtherDeedApplication.find({
        status: { $in: ['Pending_AC_Land_Review', 'Payment_Pending'] },
        $or: [
          { 'heba.donor_nid': { $in: [rawNid, engNid, bngNid] } },
          { 'heba.recipient_nid': { $in: [rawNid, engNid, bngNid] } },
          { 'exchange.owner1.nid': { $in: [rawNid, engNid, bngNid] } },
          { 'exchange.owner2.nid': { $in: [rawNid, engNid, bngNid] } },
          { 'wakfo.donor_nid': { $in: [rawNid, engNid, bngNid] } },
          { 'wakfo.institution_nid': { $in: [rawNid, engNid, bngNid] } }
        ]
      }).populate('heba.land_record_id').sort({ createdAt: -1 });
    } catch (e1) {
      console.warn('Pending other deeds error:', e1.message);
    }

    // 6. Find pending Sale mutations (P4 e-mutation) for THIS citizen
    let pendingSaleMutations = [];
    try {
      pendingSaleMutations = await LandRecord.find({
        status: 'Pending_Mutation',
        $or: nidConditions
      }).sort({ updatedAt: -1 });
    } catch (e2) {
      console.warn('Pending sale mutations error:', e2.message);
    }

    // 7. Find pending Bontonnama mutations for THIS citizen
    let pendingBontonMutations = [];
    try {
      pendingBontonMutations = await BontonnamaApplication.find({
        status: { $in: ['Pending_AC_Land_Review', 'Payment_Pending'] },
        'heirs.nid': { $in: [rawNid, engNid, bngNid] }
      }).populate('land_record_id').sort({ createdAt: -1 });
    } catch (e3) {
      console.warn('Pending bonton mutations error:', e3.message);
    }

    // 8. Combine into a unified pending mutations list
    const combinedPendingMutations = [];

    // Heba & Exchange mutations
    pendingOtherDeeds.forEach(app => {
      if (app.deed_type === 'Heba') {
        const isDonor = [rawNid, engNid, bngNid].includes(app.heba?.donor_nid);
        combinedPendingMutations.push({
          _id: app._id,
          type: 'Heba',
          type_bn: 'দানপত্র / হেবা দলিল নামজারি',
          badge_color: '#047857',
          badge_bg: '#d1fae5',
          status: app.status,
          status_bn: 'হেবা দলিল নামজারি প্রক্রিয়ায় রয়েছে (এসি ল্যান্ড পর্যালোচনা)',
          role: isDonor ? 'দাতা' : 'গ্রহীতা',
          deed_no: app.deed_no,
          application_no: app.application_no,
          mouza: app.heba?.mouza || app.heba?.land_record_id?.mouza || '',
          dag_no: app.heba?.dag_no || app.heba?.land_record_id?.dag_no || '',
          khatian_no: app.heba?.khatian_no || app.heba?.land_record_id?.khatian_no || '',
          area_decimal: app.heba?.gift_area_decimal || app.heba?.land_record_id?.available_area_decimal || 0,
          donor_name: app.heba?.donor_name,
          donor_nid: app.heba?.donor_nid,
          recipient_name: app.heba?.recipient_name,
          recipient_nid: app.heba?.recipient_nid,
          relationship: app.heba?.relationship,
          created_at: app.createdAt
        });
      } else if (app.deed_type === 'Exchange') {
        const isP1 = [rawNid, engNid, bngNid].includes(app.exchange?.owner1?.nid);
        combinedPendingMutations.push({
          _id: app._id,
          type: 'Exchange',
          type_bn: 'বিনিময় দলিল নামজারি',
          badge_color: '#0284c7',
          badge_bg: '#e0f2fe',
          status: app.status,
          status_bn: 'বিনিময় দলিল নামজারি প্রক্রিয়ায় রয়েছে (এসি ল্যান্ড পর্যালোচনা)',
          role: isP1 ? 'মালিক ১ (বিনিময়কারী)' : 'মালিক ২ (বিনিময়কারী)',
          deed_no: app.deed_no,
          application_no: app.application_no,
          mouza: isP1 ? app.exchange?.owner1?.mouza : app.exchange?.owner2?.mouza,
          dag_no: isP1 ? app.exchange?.owner1?.dag_no : app.exchange?.owner2?.dag_no,
          khatian_no: isP1 ? app.exchange?.owner1?.khatian_no : app.exchange?.owner2?.khatian_no,
          area_decimal: isP1 ? app.exchange?.owner1?.area_decimal : app.exchange?.owner2?.area_decimal,
          other_mouza: isP1 ? app.exchange?.owner2?.mouza : app.exchange?.owner1?.mouza,
          other_dag: isP1 ? app.exchange?.owner2?.dag_no : app.exchange?.owner1?.dag_no,
          other_area: isP1 ? app.exchange?.owner2?.area_decimal : app.exchange?.owner1?.area_decimal,
          owner1_name: app.exchange?.owner1?.name,
          owner2_name: app.exchange?.owner2?.name,
          created_at: app.createdAt
        });
      } else if (app.deed_type === 'Wakfo') {
        const isDonor = [rawNid, engNid, bngNid].includes(app.wakfo?.donor_nid);
        combinedPendingMutations.push({
          _id: app._id,
          type: 'Wakfo',
          type_bn: 'ওয়াকফ দলিল নামজারি',
          badge_color: '#0f766e',
          badge_bg: '#ccfbf1',
          status: app.status,
          status_bn: 'ওয়াকফ দলিল নামজারি প্রক্রিয়ায় রয়েছে (এসি ল্যান্ড পর্যালোচনা)',
          role: isDonor ? 'দাতা (ওয়াকিফ)' : 'গ্রহীতা প্রতিষ্ঠান (ওয়াকফ এস্টেট)',
          deed_no: app.deed_no,
          application_no: app.application_no,
          mouza: app.wakfo?.mouza || '',
          dag_no: app.wakfo?.dag_no || '',
          khatian_no: app.wakfo?.khatian_no || '',
          area_decimal: app.wakfo?.wakfo_area_decimal || 0,
          donor_name: app.wakfo?.donor_name,
          donor_nid: app.wakfo?.donor_nid,
          recipient_name: app.wakfo?.institution_name,
          recipient_nid: app.wakfo?.institution_nid,
          institution_type: app.wakfo?.institution_type,
          wakfo_purpose: app.wakfo?.wakfo_purpose,
          created_at: app.createdAt
        });
      }
    });

    // Sale mutations (P4 e-mutation)
    pendingSaleMutations.forEach(rec => {
      const isSeller = [rawNid, engNid, bngNid].includes(rec.owner_nid);
      combinedPendingMutations.push({
        _id: rec._id,
        type: 'Sale',
        type_bn: 'সাফ-কবলা / বিক্রয় নামজারি',
        badge_color: '#d97706',
        badge_bg: '#fef3c7',
        status: rec.status,
        status_bn: 'বিক্রয় দলিল নামজারি প্রক্রিয়ায় রয়েছে (Pending Mutation)',
        role: isSeller ? 'বিক্রেতা' : 'ক্রেতা',
        deed_no: rec.deed_no || (rec.deed_details ? rec.deed_details.deed_no : `DEED-${rec.dag_no}`),
        mouza: rec.mouza,
        dag_no: rec.dag_no,
        khatian_no: rec.khatian_no,
        area_decimal: rec.sold_area_decimal || rec.available_area_decimal,
        seller_name: rec.owner_name,
        buyer_name: Array.isArray(rec.buyers) && rec.buyers[0] ? rec.buyers[0].name : '',
        created_at: rec.updatedAt || rec.createdAt
      });
    });

    // Bontonnama mutations
    pendingBontonMutations.forEach(app => {
      combinedPendingMutations.push({
        _id: app._id,
        type: 'Bonton',
        type_bn: 'ওয়ারিশ বণ্টননামা নামজারি',
        badge_color: '#7c3aed',
        badge_bg: '#ede9fe',
        status: app.status,
        status_bn: 'ওয়ারিশ বণ্টননামা নামজারি প্রক্রিয়ায় রয়েছে',
        role: 'ওয়ারিশ',
        application_no: app.application_no,
        mouza: app.mouza || app.land_record_id?.mouza,
        dag_no: app.dag_no || app.land_record_id?.dag_no,
        khatian_no: app.khatian_no || app.land_record_id?.khatian_no,
        area_decimal: app.total_area_decimal || app.land_record_id?.total_area_decimal,
        deceased_name: app.deceased_name,
        heirs_count: app.heirs?.length || 0,
        created_at: app.createdAt
      });
    });

    // Standard Land Allocation / Assignment
    pendingAssignments.forEach(req => {
      combinedPendingMutations.push({
        _id: req._id,
        type: 'Assignment',
        type_bn: 'প্রাথমিক জমি বরাদ্দ নামজারি',
        badge_color: '#b45309',
        badge_bg: '#fef3c7',
        status: req.status,
        status_bn: 'জমি বরাদ্দ নামজারি পর্যালোচনায় অপেক্ষমান',
        role: 'আবেদনকারী',
        mouza: req.mouza,
        dag_no: req.dag_no,
        khatian_no: req.khatian_no,
        area_decimal: req.area_decimal,
        volume_book: req.volume_book,
        page_no: req.page_no,
        created_at: req.createdAt || req.created_at
      });
    });

    return res.status(200).json({
      success: true,
      data: {
        active_lands: activeLands,
        sold_lands: soldLands,
        approved_assignments: approvedAssignments,
        pending_assignments: pendingAssignments,
        pending_mutations: combinedPendingMutations
      }
    });
  } catch (err) {
    console.error('Error fetching assigned lands:', err);
    return res.status(500).json({ success: false, message: 'জমির তালিকা লোড করতে ব্যর্থ হয়েছে।' });
  }
});

module.exports = router;
