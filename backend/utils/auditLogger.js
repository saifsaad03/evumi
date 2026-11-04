const SystemLog = require('../models/SystemLog');
const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '..', 'data', 'system_logs.json');

// Ensure in-memory fallback list
const loadLogsFromFile = () => {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Could not read system_logs.json:', e.message);
  }
  return [];
};

const saveLogsToFile = (logs) => {
  try {
    const dir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // Keep last 1000 logs in file
    const trimmed = logs.slice(0, 1000);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (e) {
    console.warn('Could not write system_logs.json:', e.message);
  }
};

if (!global._memorySystemLogs) {
  global._memorySystemLogs = loadLogsFromFile();
}

const cleanIp = (ip) => {
  if (!ip) return '127.0.0.1';
  let clean = ip.toString();
  if (clean.includes('::ffff:')) clean = clean.replace('::ffff:', '');
  if (clean === '::1') clean = '127.0.0.1';
  return clean;
};

/**
 * Log any system action asynchronously and safely.
 * @param {Object} options
 * @param {Object} [options.req] - Express request object (optional)
 * @param {Object} [options.actor] - Actor override { id, name, email, role, nid }
 * @param {string} options.action_type - e.g. 'DEED_GRANTED', 'USER_PROFILE_UPDATED'
 * @param {string} options.module - e.g. 'Deed_Registry', 'User_Management'
 * @param {string} options.description - Clear Bengali description
 * @param {string} [options.target_resource] - Resource identifier (Mouza, Dag, Khatian or User ID)
 * @param {Object} [options.details] - Arbitrary JSON metadata / differences
 * @param {string} [options.status] - 'SUCCESS' | 'FAILED' | 'WARNING' | 'INFO'
 */
const logActivity = async (options = {}) => {
  try {
    const {
      req,
      actor,
      action_type,
      module,
      description,
      target_resource = '',
      details = {},
      status = 'SUCCESS'
    } = options;

    if (!action_type || !module || !description) {
      console.warn('logActivity called without mandatory parameters:', options);
      return;
    }

    // Determine actor
    let resolvedUser = actor || (req && req.user) || {};
    let userName = resolvedUser.name || 'সিস্টেম এডমিন';
    let userEmail = resolvedUser.email || '';
    let userRole = resolvedUser.role || 'System';
    let userNid = resolvedUser.nid || '';
    let userId = (resolvedUser._id || resolvedUser.id || '').toString();

    // Determine IP address
    let clientIp = '127.0.0.1';
    if (req) {
      const forwarded = req.headers ? (req.headers['x-forwarded-for'] || req.headers['x-real-ip']) : null;
      clientIp = cleanIp(forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.socket?.remoteAddress));
    }

    const logEntry = {
      user_id: userId || null,
      user_name: userName,
      user_email: userEmail,
      user_role: userRole,
      user_nid: userNid,
      action_type,
      module,
      description,
      target_resource,
      details,
      ip_address: clientIp,
      status,
      timestamp: new Date()
    };

    // Save to resilient memory ring buffer first
    global._memorySystemLogs.unshift({
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      ...logEntry
    });
    if (global._memorySystemLogs.length > 2000) {
      global._memorySystemLogs.pop();
    }
    saveLogsToFile(global._memorySystemLogs);

    // Save to MongoDB asynchronously
    SystemLog.create(logEntry).catch(dbErr => {
      // In-memory fallback is already preserved
      console.warn('SystemLog DB write warning (fallback saved):', dbErr.message);
    });

  } catch (err) {
    console.error('Audit logger internal error:', err.message);
  }
};

/**
 * Seed realistic initial historical logs if the audit table is empty
 */
const seedInitialAuditLogs = async () => {
  try {
    const count = await SystemLog.countDocuments();
    if (count >= 8 || global._memorySystemLogs.length >= 8) {
      return; // Already has logs
    }

    const initialLogs = [
      {
        user_name: 'মন্ত্রণালয় প্রধান এডমিন',
        user_email: 'admin@evhumi.gov.bd',
        user_role: 'Super Admin',
        user_nid: '0000000000000',
        action_type: 'SYSTEM_BOOT',
        module: 'System',
        description: '🏛️ e-ভূমি কেন্দ্রীয় প্ল্যাটফর্ম সফলভাবে বুট ও সক্রিয় করা হয়েছে।',
        target_resource: 'ভূমি মন্ত্রণালয়, বাংলাদেশ সচিবালয়',
        details: { version: '2.0.26', environment: 'Production' },
        ip_address: '127.0.0.1',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 7 * 86400000)
      },
      {
        user_name: 'মন্ত্রণালয় প্রধান এডমিন',
        user_email: 'admin@evhumi.gov.bd',
        user_role: 'Super Admin',
        user_nid: '0000000000000',
        action_type: 'ADMIN_USER_CREATED',
        module: 'User_Management',
        description: 'সাব-রেজিস্ট্রি অফিসার (শিবগঞ্জ) একাউন্ট তৈরি ও দায়িত্ব বণ্টন সম্পন্ন।',
        target_resource: 'ইউজার: vabna (vabna03p@gmail.com)',
        details: { role: 'Register Office', office: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস' },
        ip_address: '127.0.0.1',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 6 * 86400000)
      },
      {
        user_name: 'মন্ত্রণালয় প্রধান এডমিন',
        user_email: 'admin@evhumi.gov.bd',
        user_role: 'Super Admin',
        user_nid: '0000000000000',
        action_type: 'ADMIN_USER_CREATED',
        module: 'User_Management',
        description: 'সহকারী কমিশনার (ভূমি) অফিসার একাউন্ট তৈরি ও ভূমিকা প্রদান সম্পন্ন।',
        target_resource: 'ইউজার: acland@evhumi.gov.bd',
        details: { role: 'AC Land Office', office: 'শিবগঞ্জ উপজেলা ভূমি অফিস' },
        ip_address: '127.0.0.1',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 5 * 86400000)
      },
      {
        user_name: 'মন্ত্রণালয় প্রধান এডমিন',
        user_email: 'admin@evhumi.gov.bd',
        user_role: 'Super Admin',
        user_nid: '0000000000000',
        action_type: 'LEGAL_CASE_ASSIGNED',
        module: 'Legal_Case',
        description: 'দেওয়ানি মামলার প্রেক্ষিতে দাগে নিষেধাজ্ঞা ও আইনি স্থিতি রেকর্ড করা হয়েছে।',
        target_resource: 'মৌজা: গুজিয়া, দাগ: ৮৫২, খতিয়ান: ১',
        details: { case_details: 'দেওয়ানি মোকদ্দমা নং ৪৫/২০২৬ (বগুড়া আদালত)', stay_order: true },
        ip_address: '127.0.0.1',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 4 * 86400000)
      },
      {
        user_name: 'Shyshob Don',
        user_email: 'shyshobdon@gmail.com',
        user_role: 'User',
        user_nid: '12345678930',
        action_type: 'USER_REGISTERED',
        module: 'Auth',
        description: 'জাতীয় পরিচয়পত্র ও মোবাইল যাচাইকরণের মাধ্যমে নতুন নাগরিক অ্যাকাউন্ট খোলা হয়েছে।',
        target_resource: 'NID: 12345678930, জেলা: বগুড়া',
        details: { division: 'রাজশাহী', district: 'বগুড়া', upazila: 'শিবগঞ্জ' },
        ip_address: '103.145.118.2',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 3 * 86400000)
      },
      {
        user_name: 'vabna',
        user_email: 'vabna03p@gmail.com',
        user_role: 'Register Office',
        user_nid: '1234567890',
        action_type: 'KHATIAN_UPDATED',
        module: 'Land_Management',
        description: 'সাব-রেজিস্ট্রি কর্মকর্তা কর্তৃক দাগ নং ৪৫-এর খতিয়ান নম্বর ১ থেকে হালনাগাদ করা হয়েছে।',
        target_resource: 'মৌজা: গুজিয়া, দাগ: ৪৫, খতিয়ান: ১',
        details: { old_khatian: '1', new_khatian: '1' },
        ip_address: '103.145.118.5',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 2 * 86400000)
      },
      {
        user_name: 'সাদ',
        user_email: 'hello@example',
        user_role: 'User',
        user_nid: '১২৩৪৫৬৭৮৯১০',
        action_type: 'LAND_CLAIM_SUBMITTED',
        module: 'Land_Claim',
        description: 'পৈতৃক সূত্রে প্রাপ্ত জমির মালিকানা দাবি সংক্রান্ত আবেদন সাবমিট করা হয়েছে।',
        target_resource: 'মৌজা: গুজিয়া, দাগ: ১২০, খতিয়ান: ১',
        details: { previous_status: 'Paternal_Inheritance' },
        ip_address: '103.145.118.9',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 1 * 86400000)
      },
      {
        user_name: 'vabna',
        user_email: 'vabna03p@gmail.com',
        user_role: 'Register Office',
        user_nid: '1234567890',
        action_type: 'DEATH_CERT_VERIFIED',
        module: 'Bonton_Nama',
        description: 'মৃত জমির মালিকের মৃত্যু সনদ যাচাই অনুমোদন এবং সংশ্লিষ্ট সকল জমির বিক্রয় সাময়িক স্থগিত (Deceased_Locked) করা হয়েছে।',
        target_resource: 'মৃত মালিক NID: ১২৩৪৫৬৭৮৯১০ (সাদ)',
        details: { certificate_no: 'DC-2026-9041', applicant_nid: '12345678930' },
        ip_address: '103.145.118.5',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 12 * 3600000)
      },
      {
        user_name: 'acland@evhumi.gov.bd',
        user_email: 'acland@evhumi.gov.bd',
        user_role: 'AC Land Office',
        user_nid: '123456789200',
        action_type: 'MUTATION_APPROVED',
        module: 'Mutation',
        description: 'সহকারী কমিশনার (ভূমি) কর্তৃক নামজারি আবেদন খতিয়ে দেখে অনুমোদন ও নতুন খতিয়ান বরাদ্দ প্রদান করা হয়েছে।',
        target_resource: 'মৌজা: গুজিয়া, দাগ: ৯২, নতুন খতিয়ান: খতিয়ান-১২৩',
        details: { dcr_amount: 1150, fee_paid: true },
        ip_address: '103.145.118.8',
        status: 'SUCCESS',
        timestamp: new Date(Date.now() - 4 * 3600000)
      }
    ];

    for (const log of initialLogs) {
      await SystemLog.create(log).catch(() => {});
      global._memorySystemLogs.push({ _id: 'seed_' + Math.random().toString(36).substring(2, 7), ...log });
    }
    saveLogsToFile(global._memorySystemLogs);
    console.log('✅ Initial Audit System Logs successfully populated');
  } catch (err) {
    console.warn('Initial audit logs seed warning:', err.message);
  }
};

module.exports = {
  logActivity,
  seedInitialAuditLogs,
  cleanIp
};
