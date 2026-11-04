const express = require('express');
const router = express.Router();
const Division = require('../models/Division');
const District = require('../models/District');
const Upazila = require('../models/Upazila');
const Mouza = require('../models/Mouza');
const Dag = require('../models/Dag');
const Khatian = require('../models/Khatian');
const LandRecord = require('../models/LandRecord');
const { verifyToken, requireRole } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLogger');

// Helper to normalize digits
const toEnglishDigits = (str) => (str || '').toString().replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d)).trim();
const toBengaliDigits = (str) => (str || '').toString().replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]).trim();

// ─────────────────────────────────────────────────────────────
// A. PUBLIC / CASCADING READ ROUTES
// ─────────────────────────────────────────────────────────────

// GET /api/locations/summary - Overall stats of location hierarchy
router.get('/summary', async (req, res) => {
  try {
    const [divisions, districts, upazilas, mouzas, dags, khatians] = await Promise.all([
      Division.countDocuments(),
      District.countDocuments(),
      Upazila.countDocuments(),
      Mouza.countDocuments(),
      Dag.countDocuments(),
      Khatian.countDocuments()
    ]);
    return res.status(200).json({
      success: true,
      data: { divisions, districts, upazilas, mouzas, dags, khatians }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'পরিসংখ্যান লোড ব্যর্থ হয়েছে।' });
  }
});

// GET /api/locations/divisions - List active divisions
router.get('/divisions', async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { status: 'Active' };
    const divisions = await Division.find(query).sort({ name: 1 });
    return res.status(200).json({ success: true, count: divisions.length, data: divisions });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'বিভাগের তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// GET /api/locations/districts - List districts under division
router.get('/districts', async (req, res) => {
  try {
    const { division_id, division_name, includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { status: 'Active' };

    if (division_id) {
      query.division_id = division_id;
    } else if (division_name) {
      const cleanName = division_name.trim();
      const div = await Division.findOne({
        $or: [
          { name: cleanName },
          { bn_name: cleanName },
          { name: new RegExp(`^${cleanName}$`, 'i') }
        ]
      });
      if (div) query.division_id = div._id;
    }

    const districts = await District.find(query).sort({ name: 1 });
    return res.status(200).json({ success: true, count: districts.length, data: districts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জেলার তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// GET /api/locations/upazilas - List upazilas under district
router.get('/upazilas', async (req, res) => {
  try {
    const { district_id, district_name, includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { status: 'Active' };

    if (district_id) {
      query.district_id = district_id;
    } else if (district_name) {
      const cleanDist = district_name.trim();
      const dist = await District.findOne({
        $or: [
          { name: cleanDist },
          { name: new RegExp(`^${cleanDist}$`, 'i') }
        ]
      });
      if (dist) query.district_id = dist._id;
    }

    const upazilas = await Upazila.find(query).sort({ name: 1 });
    return res.status(200).json({ success: true, count: upazilas.length, data: upazilas });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'উপজেলার তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// GET /api/locations/mouzas - List mouzas under upazila
router.get('/mouzas', async (req, res) => {
  try {
    const { upazila_id, upazila_name, includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { status: 'Active' };

    if (upazila_id) {
      query.upazila_id = upazila_id;
    } else if (upazila_name) {
      const cleanUpz = upazila_name.trim();
      const upz = await Upazila.findOne({
        $or: [
          { name: cleanUpz },
          { name: new RegExp(`^${cleanUpz}$`, 'i') }
        ]
      });
      if (upz) query.upazila_id = upz._id;
    }

    const mouzas = await Mouza.find(query).sort({ jl_no: 1, name: 1 });
    return res.status(200).json({ success: true, count: mouzas.length, data: mouzas });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মৌজার তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// GET /api/locations/dags - List dags under mouza
router.get('/dags', async (req, res) => {
  try {
    const { mouza_id, mouza_name, includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { status: 'Active' };

    if (mouza_id) {
      query.mouza_id = mouza_id;
    } else if (mouza_name) {
      const m = await Mouza.findOne({ name: mouza_name.trim() });
      if (m) query.mouza_id = m._id;
    }

    const dags = await Dag.find(query).sort({ dag_no: 1 });
    return res.status(200).json({ success: true, count: dags.length, data: dags });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'দাগ নম্বরের তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// GET /api/locations/khatians - List khatians under dag
router.get('/khatians', async (req, res) => {
  try {
    const { dag_id, dag_no, includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { status: 'Active' };

    if (dag_id) {
      query.dag_id = dag_id;
    } else if (dag_no) {
      const cleanDag = dag_no.toString().trim();
      const eng = toEnglishDigits(cleanDag);
      const bng = toBengaliDigits(cleanDag);
      const d = await Dag.findOne({ $or: [{ dag_no: cleanDag }, { dag_no: eng }, { dag_no: bng }] });
      if (d) query.dag_id = d._id;
    }

    const khatians = await Khatian.find(query).sort({ khatian_no: 1 });
    return res.status(200).json({ success: true, count: khatians.length, data: khatians });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'খতিয়ান নম্বরের তালিকা লোড ব্যর্থ হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// B. ADMIN-CONTROLLED STEP-BY-STEP HIERARCHY CREATION (Super Admin)
// ─────────────────────────────────────────────────────────────

// STEP 1: Division Create & Manage
router.post('/divisions', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { name, code, bn_name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'বিভাগের নাম প্রদান আবশ্যক।' });
    }

    const cleanName = name.trim();
    const existing = await Division.findOne({ name: cleanName });
    if (existing) {
      return res.status(400).json({ success: false, message: `⚠️ '${cleanName}' বিভাগটি ইতিমধ্যে বিদ্যমান রয়েছে!` });
    }

    const division = new Division({
      name: cleanName,
      code: (code || '').trim(),
      bn_name: (bn_name || cleanName).trim(),
      description: (description || '').trim()
    });
    await division.save();

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক নতুন বিভাগ তৈরি: ${cleanName}`,
      target_resource: `বিভাগ: ${cleanName}`
    });

    return res.status(201).json({ success: true, message: `✅ নতুন বিভাগ '${cleanName}' সফলভাবে তৈরি হয়েছে!`, data: division });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'বিভাগ তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

router.put('/divisions/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { name, code, bn_name, status, description } = req.body;
    const division = await Division.findById(req.params.id);
    if (!division) return res.status(404).json({ success: false, message: 'বিভাগ খুঁজে পাওয়া যায়নি।' });

    if (name) division.name = name.trim();
    if (code !== undefined) division.code = code.trim();
    if (bn_name) division.bn_name = bn_name.trim();
    if (status) division.status = status;
    if (description !== undefined) division.description = description.trim();

    await division.save();
    return res.status(200).json({ success: true, message: 'বিভাগ আপডেট সম্পন্ন হয়েছে!', data: division });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'বিভাগ আপডেট ব্যর্থ হয়েছে।' });
  }
});

router.delete('/divisions/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) return res.status(404).json({ success: false, message: 'বিভাগ পাওয়া যায়নি।' });

    // Data Integrity Check: Check if child districts exist
    const childCount = await District.countDocuments({ division_id: division._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `⚠️ এই বিভাগের অধীনে ${childCount}টি জেলা সংযুক্ত রয়েছে! ডেটা অখণ্ডতা রক্ষার জন্য প্রথমে অধস্তন জেলাগুলো অপসারণ বা স্থানান্তর করুন।`
      });
    }

    await Division.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: `বিভাগ '${division.name}' মুছে ফেলা হয়েছে!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'বিভাগ মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// STEP 2: District Create & Manage (Parent: Division)
router.post('/districts', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { division_id, name, code, description } = req.body;
    if (!division_id) {
      return res.status(400).json({ success: false, message: 'জেলা যুক্ত করার জন্য অবশ্যই বিভাগ নির্বাচন করতে হবে।' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'জেলার নাম প্রদান আবশ্যক।' });
    }

    const division = await Division.findById(division_id);
    if (!division) {
      return res.status(404).json({ success: false, message: 'নির্বাচিত বিভাগটি পাওয়া যায়নি।' });
    }

    const cleanName = name.trim();
    const existing = await District.findOne({ division_id: division._id, name: cleanName });
    if (existing) {
      return res.status(400).json({ success: false, message: `⚠️ '${division.name}' বিভাগের অধীনে '${cleanName}' জেলা ইতিমধ্যে বিদ্যমান রয়েছে!` });
    }

    const district = new District({
      division_id: division._id,
      division_name: division.name,
      name: cleanName,
      code: (code || '').trim(),
      description: (description || '').trim()
    });
    await district.save();

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক নতুন জেলা তৈরি: ${cleanName} (বিভাগ: ${division.name})`,
      target_resource: `বিভাগ: ${division.name}, জেলা: ${cleanName}`
    });

    return res.status(201).json({ success: true, message: `✅ '${division.name}' বিভাগের অধীনে নতুন জেলা '${cleanName}' তৈরি হয়েছে!`, data: district });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জেলা তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

router.put('/districts/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { name, code, status, description } = req.body;
    const district = await District.findById(req.params.id);
    if (!district) return res.status(404).json({ success: false, message: 'জেলা পাওয়া যায়নি।' });

    if (name) district.name = name.trim();
    if (code !== undefined) district.code = code.trim();
    if (status) district.status = status;
    if (description !== undefined) district.description = description.trim();

    await district.save();
    return res.status(200).json({ success: true, message: 'জেলা আপডেট সম্পন্ন হয়েছে!', data: district });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জেলা আপডেট ব্যর্থ হয়েছে।' });
  }
});

router.delete('/districts/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const district = await District.findById(req.params.id);
    if (!district) return res.status(404).json({ success: false, message: 'জেলা পাওয়া যায়নি।' });

    const childCount = await Upazila.countDocuments({ district_id: district._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `⚠️ এই জেলার অধীনে ${childCount}টি উপজেলা বিদ্যমান রয়েছে! প্রথমে অধস্তন উপজেলাগুলো অপসারণ করুন।`
      });
    }

    await District.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: `জেলা '${district.name}' মুছে ফেলা হয়েছে!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'জেলা মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// STEP 3: Upazila Create & Manage (Parent: District)
router.post('/upazilas', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { district_id, name, code, description } = req.body;
    if (!district_id) {
      return res.status(400).json({ success: false, message: 'উপজেলা তৈরি করার জন্য জেলা নির্বাচন আবশ্যক।' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'উপজেলার নাম প্রদান আবশ্যক।' });
    }

    const district = await District.findById(district_id);
    if (!district) {
      return res.status(404).json({ success: false, message: 'নির্বাচিত জেলাটি পাওয়া যায়নি।' });
    }

    const cleanName = name.trim();
    const existing = await Upazila.findOne({ district_id: district._id, name: cleanName });
    if (existing) {
      return res.status(400).json({ success: false, message: `⚠️ '${district.name}' জেলার অধীনে '${cleanName}' উপজেলা ইতিমধ্যে বিদ্যমান রয়েছে!` });
    }

    const upazila = new Upazila({
      division_id: district.division_id,
      district_id: district._id,
      district_name: district.name,
      name: cleanName,
      code: (code || '').trim(),
      description: (description || '').trim()
    });
    await upazila.save();

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক নতুন উপজেলা তৈরি: ${cleanName} (জেলা: ${district.name})`,
      target_resource: `জেলা: ${district.name}, উপজেলা: ${cleanName}`
    });

    return res.status(201).json({ success: true, message: `✅ নতুন উপজেলা '${cleanName}' সফলভাবে তৈরি হয়েছে!`, data: upazila });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'উপজেলা তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

router.put('/upazilas/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { name, code, status, description } = req.body;
    const upazila = await Upazila.findById(req.params.id);
    if (!upazila) return res.status(404).json({ success: false, message: 'উপজেলা পাওয়া যায়নি।' });

    if (name) upazila.name = name.trim();
    if (code !== undefined) upazila.code = code.trim();
    if (status) upazila.status = status;
    if (description !== undefined) upazila.description = description.trim();

    await upazila.save();
    return res.status(200).json({ success: true, message: 'উপজেলা আপডেট সম্পন্ন হয়েছে!', data: upazila });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'উপজেলা আপডেট ব্যর্থ হয়েছে।' });
  }
});

router.delete('/upazilas/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const upazila = await Upazila.findById(req.params.id);
    if (!upazila) return res.status(404).json({ success: false, message: 'উপজেলা পাওয়া যায়নি।' });

    const childCount = await Mouza.countDocuments({ upazila_id: upazila._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `⚠️ এই উপজেলার অধীনে ${childCount}টি মৌজা বিদ্যমান রয়েছে! প্রথমে অধস্তন মৌজাগুলো অপসারণ করুন।`
      });
    }

    await Upazila.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: `উপজেলা '${upazila.name}' মুছে ফেলা হয়েছে!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'উপজেলা মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// STEP 4: Mouza Create & Manage (Parent: Upazila)
router.post('/mouzas', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { upazila_id, name, jl_no, remarks } = req.body;
    if (!upazila_id) {
      return res.status(400).json({ success: false, message: 'মৌজা তৈরি করার জন্য উপজেলা নির্বাচন আবশ্যক।' });
    }
    if (!name || !name.trim() || !jl_no) {
      return res.status(400).json({ success: false, message: 'মৌজার নাম এবং জে.এল নম্বর প্রদান আবশ্যক।' });
    }

    const upazila = await Upazila.findById(upazila_id);
    if (!upazila) {
      return res.status(404).json({ success: false, message: 'নির্বাচিত উপজেলাটি পাওয়া যায়নি।' });
    }

    const cleanName = name.trim();
    const cleanJl = jl_no.toString().trim();
    const existing = await Mouza.findOne({ upazila_id: upazila._id, name: cleanName });
    if (existing) {
      return res.status(400).json({ success: false, message: `⚠️ '${upazila.name}' উপজেলার অধীনে '${cleanName}' মৌজা ইতিমধ্যে বিদ্যমান রয়েছে!` });
    }

    const mouza = new Mouza({
      division_id: upazila.division_id,
      district_id: upazila.district_id,
      upazila_id: upazila._id,
      upazila_name: upazila.name,
      name: cleanName,
      jl_no: cleanJl,
      remarks: (remarks || '').trim()
    });
    await mouza.save();

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক নতুন মৌজা তৈরি: ${cleanName} (জে.এল: ${cleanJl}, উপজেলা: ${upazila.name})`,
      target_resource: `উপজেলা: ${upazila.name}, মৌজা: ${cleanName}, জে.এল: ${cleanJl}`
    });

    return res.status(201).json({ success: true, message: `✅ নতুন মৌজা '${cleanName}' (জে.এল: ${cleanJl}) সফলভাবে তৈরি হয়েছে!`, data: mouza });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মৌজা তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

router.put('/mouzas/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { name, jl_no, status, remarks } = req.body;
    const mouza = await Mouza.findById(req.params.id);
    if (!mouza) return res.status(404).json({ success: false, message: 'মৌজা পাওয়া যায়নি।' });

    if (name) mouza.name = name.trim();
    if (jl_no !== undefined) mouza.jl_no = jl_no.toString().trim();
    if (status) mouza.status = status;
    if (remarks !== undefined) mouza.remarks = remarks.trim();

    await mouza.save();
    return res.status(200).json({ success: true, message: 'মৌজা আপডেট সম্পন্ন হয়েছে!', data: mouza });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মৌজা আপডেট ব্যর্থ হয়েছে।' });
  }
});

router.delete('/mouzas/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const mouza = await Mouza.findById(req.params.id);
    if (!mouza) return res.status(404).json({ success: false, message: 'মৌজা পাওয়া যায়নি।' });

    const childCount = await Dag.countDocuments({ mouza_id: mouza._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `⚠️ এই মৌজার অধীনে ${childCount}টি দাগ নম্বর সংযুক্ত রয়েছে! প্রথমে অধস্তন দাগ নম্বরগুলো অপসারণ করুন।`
      });
    }

    await Mouza.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: `মৌজা '${mouza.name}' মুছে ফেলা হয়েছে!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'মৌজা মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// STEP 5: Dag Number Create & Manage (Parent: Mouza)
router.post('/dags', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { mouza_id, dag_no, land_type, total_area_decimal, remarks } = req.body;
    if (!mouza_id) {
      return res.status(400).json({ success: false, message: 'দাগ নম্বর তৈরি করার জন্য মৌজা নির্বাচন আবশ্যক।' });
    }
    if (!dag_no || !dag_no.toString().trim()) {
      return res.status(400).json({ success: false, message: 'দাগ নম্বর প্রদান আবশ্যক।' });
    }

    const mouza = await Mouza.findById(mouza_id);
    if (!mouza) {
      return res.status(404).json({ success: false, message: 'নির্বাচিত মৌজাটি পাওয়া যায়নি।' });
    }

    const cleanDag = dag_no.toString().trim();
    const existing = await Dag.findOne({ mouza_id: mouza._id, dag_no: cleanDag });
    if (existing) {
      return res.status(400).json({ success: false, message: `⚠️ '${mouza.name}' মৌজার অধীনে '${cleanDag}' দাগ নম্বর ইতিমধ্যে বিদ্যমান রয়েছে!` });
    }

    const area = parseFloat(total_area_decimal) || 10;
    const dag = new Dag({
      mouza_id: mouza._id,
      mouza_name: mouza.name,
      dag_no: cleanDag,
      land_type: (land_type || 'নাল / কৃষি জমি').trim(),
      total_area_decimal: area,
      remarks: (remarks || '').trim()
    });
    await dag.save();

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক নতুন দাগ নম্বর তৈরি: দাগ ${cleanDag} (মৌজা: ${mouza.name}, পরিমাণ: ${area} শতক)`,
      target_resource: `মৌজা: ${mouza.name}, দাগ: ${cleanDag}`
    });

    return res.status(201).json({ success: true, message: `✅ নতুন দাগ নম্বর '${cleanDag}' সফলভাবে তৈরি হয়েছে!`, data: dag });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'দাগ নম্বর তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

router.put('/dags/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { dag_no, land_type, total_area_decimal, status, remarks } = req.body;
    const dag = await Dag.findById(req.params.id);
    if (!dag) return res.status(404).json({ success: false, message: 'দাগ নম্বর পাওয়া যায়নি।' });

    if (dag_no) dag.dag_no = dag_no.toString().trim();
    if (land_type) dag.land_type = land_type.trim();
    if (total_area_decimal !== undefined) dag.total_area_decimal = parseFloat(total_area_decimal) || dag.total_area_decimal;
    if (status) dag.status = status;
    if (remarks !== undefined) dag.remarks = remarks.trim();

    await dag.save();
    return res.status(200).json({ success: true, message: 'দাগ নম্বর আপডেট সম্পন্ন হয়েছে!', data: dag });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'দাগ নম্বর আপডেট ব্যর্থ হয়েছে।' });
  }
});

router.delete('/dags/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const dag = await Dag.findById(req.params.id);
    if (!dag) return res.status(404).json({ success: false, message: 'দাগ নম্বর পাওয়া যায়নি।' });

    const childCount = await Khatian.countDocuments({ dag_id: dag._id });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `⚠️ এই দাগ নম্বরের অধীনে ${childCount}টি খতিয়ান সংযুক্ত রয়েছে! প্রথমে খতিয়ানগুলো অপসারণ করুন।`
      });
    }

    await Dag.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: `দাগ নং '${dag.dag_no}' মুছে ফেলা হয়েছে!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'দাগ নম্বর মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// STEP 6: Khatian Number Create & Manage (Parent: Dag)
// Super Admin only creates the Khatian structure; Register Office will assign land to citizens!
router.post('/khatians', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { dag_id, khatian_no, khatian_type, remarks } = req.body;
    if (!dag_id) {
      return res.status(400).json({ success: false, message: 'খতিয়ান নম্বর তৈরি করার জন্য দাগ নম্বর নির্বাচন আবশ্যক।' });
    }
    if (!khatian_no || !khatian_no.toString().trim()) {
      return res.status(400).json({ success: false, message: 'খতিয়ান নম্বর প্রদান আবশ্যক।' });
    }

    const dag = await Dag.findById(dag_id);
    if (!dag) {
      return res.status(404).json({ success: false, message: 'নির্বাচিত দাগ নম্বরটি পাওয়া যায়নি।' });
    }

    const mouza = await Mouza.findById(dag.mouza_id);
    const cleanKhatian = khatian_no.toString().trim();
    const existing = await Khatian.findOne({ dag_id: dag._id, khatian_no: cleanKhatian });
    if (existing) {
      return res.status(400).json({ success: false, message: `⚠️ দাগ নং '${dag.dag_no}'-এর অধীনে খতিয়ান '${cleanKhatian}' ইতিমধ্যে বিদ্যমান রয়েছে!` });
    }

    const area = dag.total_area_decimal || 10;
    const finalOwnerName = 'বাংলাদেশ সরকার (১নং খাস খতিয়ান)';
    const finalOwnerNid = 'GOVT-KHAS-01';

    const khatian = new Khatian({
      dag_id: dag._id,
      dag_no: dag.dag_no,
      mouza_id: dag.mouza_id,
      mouza_name: dag.mouza_name,
      khatian_no: cleanKhatian,
      khatian_type: (khatian_type || 'বিএস (BS)').trim(),
      owner_name: finalOwnerName,
      owner_nid: finalOwnerNid,
      area_decimal: area,
      remarks: (remarks || '').trim()
    });
    await khatian.save();

    // Auto-create/sync to LandRecord as unassigned/khas so Register Office can assign this land to a citizen
    let upazila = mouza ? await Upazila.findById(mouza.upazila_id) : null;
    let district = upazila ? await District.findById(upazila.district_id) : null;
    let division = district ? await Division.findById(district.division_id) : null;

    const recordId = `record_dyn_${Date.now()}`;
    const newLand = new LandRecord({
      record_id: recordId,
      division: division?.name || 'রাজশাহী',
      district: district?.name || 'বগুড়া',
      upazila: upazila?.name || 'শিবগঞ্জ',
      mouza: dag.mouza_name,
      jl_no: mouza?.jl_no || '1',
      khatian_no: cleanKhatian,
      dag_no: dag.dag_no,
      owner_name: finalOwnerName,
      owner_nid: finalOwnerNid,
      total_area_decimal: area,
      available_area_decimal: area,
      status: 'Active',
      land_type: dag.land_type || 'কৃষি জমি',
      remarks: `রেজিস্ট্রি অফিসে বরাদ্দযোগ্য খাস খতিয়ান (${cleanKhatian})`
    });
    const createdLandRecord = await newLand.save();

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `সুপার এডমিন কর্তৃক নতুন খতিয়ান নম্বর তৈরি: খতিয়ান ${cleanKhatian} (দাগ: ${dag.dag_no}, মৌজা: ${dag.mouza_name})`,
      target_resource: `মৌজা: ${dag.mouza_name}, দাগ: ${dag.dag_no}, খতিয়ান: ${cleanKhatian}`,
      details: { autoCreatedLandRecordId: createdLandRecord?._id }
    });

    return res.status(201).json({
      success: true,
      message: `✅ নতুন খতিয়ান '${cleanKhatian}' সফলভাবে তৈরি হয়েছে! সাব-রেজিস্ট্রি অফিস এখন এই খতিয়ানে জমি বরাদ্দ করতে পারবে।`,
      data: khatian,
      landRecord: createdLandRecord
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'খতিয়ান তৈরি ব্যর্থ হয়েছে।', error: err.message });
  }
});

router.put('/khatians/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const { khatian_no, khatian_type, owner_name, owner_nid, area_decimal, status, remarks } = req.body;
    const khatian = await Khatian.findById(req.params.id);
    if (!khatian) return res.status(404).json({ success: false, message: 'খতিয়ান পাওয়া যায়নি।' });

    if (khatian_no) khatian.khatian_no = khatian_no.toString().trim();
    if (khatian_type) khatian.khatian_type = khatian_type.trim();
    if (owner_name) khatian.owner_name = owner_name.trim();
    if (owner_nid) khatian.owner_nid = owner_nid.trim();
    if (area_decimal !== undefined) khatian.area_decimal = parseFloat(area_decimal) || khatian.area_decimal;
    if (status) khatian.status = status;
    if (remarks !== undefined) khatian.remarks = remarks.trim();

    await khatian.save();
    return res.status(200).json({ success: true, message: 'খতিয়ান আপডেট সম্পন্ন হয়েছে!', data: khatian });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'খতিয়ান আপডেট ব্যর্থ হয়েছে।' });
  }
});

router.delete('/khatians/:id', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const khatian = await Khatian.findById(req.params.id);
    if (!khatian) return res.status(404).json({ success: false, message: 'খতিয়ান পাওয়া যায়নি।' });

    await Khatian.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: `খতিয়ান '${khatian.khatian_no}' মুছে ফেলা হয়েছে!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'খতিয়ান মুছে ফেলা ব্যর্থ হয়েছে।' });
  }
});

// ─────────────────────────────────────────────────────────────
// C. MIGRATION & EXISTING DATA BRIDGE
// ─────────────────────────────────────────────────────────────

// POST /api/locations/migrate-existing - Auto-populate dynamic hierarchy from existing LandRecords
router.post('/migrate-existing', verifyToken, requireRole('Super Admin'), async (req, res) => {
  try {
    const lands = await LandRecord.find({});
    let createdDivs = 0, createdDists = 0, createdUpzs = 0, createdMouzas = 0, createdDags = 0, createdKhatians = 0;

    for (const land of lands) {
      const divName = (land.division || 'রাজশাহী').trim();
      const distName = (land.district || 'বগুড়া').trim();
      const upzName = (land.upazila || 'শিবগঞ্জ').trim();
      const mouzaName = (land.mouza || 'গুজিয়া').trim();
      const jlNo = (land.jl_no || '1').toString().trim();
      const dagNo = (land.dag_no || '১').toString().trim();
      const khatianNo = (land.khatian_no || '১').toString().trim();

      // 1. Division
      let division = await Division.findOne({ name: divName });
      if (!division) {
        division = await Division.create({ name: divName, bn_name: divName });
        createdDivs++;
      }

      // 2. District
      let district = await District.findOne({ division_id: division._id, name: distName });
      if (!district) {
        district = await District.create({ division_id: division._id, division_name: division.name, name: distName });
        createdDists++;
      }

      // 3. Upazila
      let upazila = await Upazila.findOne({ district_id: district._id, name: upzName });
      if (!upazila) {
        upazila = await Upazila.create({
          division_id: division._id,
          district_id: district._id,
          district_name: district.name,
          name: upzName
        });
        createdUpzs++;
      }

      // 4. Mouza
      let mouza = await Mouza.findOne({ upazila_id: upazila._id, name: mouzaName });
      if (!mouza) {
        mouza = await Mouza.create({
          division_id: division._id,
          district_id: district._id,
          upazila_id: upazila._id,
          upazila_name: upazila.name,
          name: mouzaName,
          jl_no: jlNo
        });
        createdMouzas++;
      }

      // 5. Dag
      let dag = await Dag.findOne({ mouza_id: mouza._id, dag_no: dagNo });
      if (!dag) {
        dag = await Dag.create({
          mouza_id: mouza._id,
          mouza_name: mouza.name,
          dag_no: dagNo,
          land_type: land.land_type || 'কৃষি জমি',
          total_area_decimal: land.total_area_decimal || 10
        });
        createdDags++;
      }

      // 6. Khatian
      let khatian = await Khatian.findOne({ dag_id: dag._id, khatian_no: khatianNo });
      if (!khatian) {
        await Khatian.create({
          dag_id: dag._id,
          dag_no: dag.dag_no,
          mouza_id: mouza._id,
          mouza_name: mouza.name,
          khatian_no: khatianNo,
          owner_name: land.owner_name || 'বাংলাদেশ সরকার',
          owner_nid: land.owner_nid || '',
          area_decimal: land.total_area_decimal || 10
        });
        createdKhatians++;
      }
    }

    logActivity({
      req,
      action_type: 'ADMIN_LAND_CREATED',
      module: 'Land_Management',
      description: `বিদ্যমান ভূমি ডাটাবেজ থেকে ডায়নামিক স্তরবিন্যাসে সফল মাইগ্রেশন সম্পন্ন`,
      details: { createdDivs, createdDists, createdUpzs, createdMouzas, createdDags, createdKhatians }
    });

    return res.status(200).json({
      success: true,
      message: `🎉 সফলভাবে মাইগ্রেশন সম্পন্ন হয়েছে! নতুন যুক্ত হয়েছে: ${createdDivs}টি বিভাগ, ${createdDists}টি জেলা, ${createdUpzs}টি উপজেলা, ${createdMouzas}টি মৌজা, ${createdDags}টি দাগ এবং ${createdKhatians}টি খতিয়ান।`,
      summary: { createdDivs, createdDists, createdUpzs, createdMouzas, createdDags, createdKhatians }
    });
  } catch (err) {
    console.error('Migration error:', err);
    return res.status(500).json({ success: false, message: 'মাইগ্রেশন ব্যর্থ হয়েছে।', error: err.message });
  }
});

module.exports = router;

