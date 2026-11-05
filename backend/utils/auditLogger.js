const SystemLog = require('../models/SystemLog');
const { hashChainedLogEntry } = require('./cryptoEngine');
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

    // Calculate Cryptographic Hash Chain for Audit Log (Immutable Ledger)
    try {
      const prevLog = (global._memorySystemLogs && global._memorySystemLogs.length > 0) ? global._memorySystemLogs[0] : null;
      const chainData = hashChainedLogEntry(logEntry, prevLog);
      logEntry.log_hash = chainData.log_hash;
      logEntry.previous_log_hash = chainData.previous_log_hash;
      logEntry.sequence_number = chainData.sequence_number;
    } catch (chainErr) {
      console.warn('Log hash chaining warning:', chainErr.message);
    }

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
  // Kept clean: No dummy audit logs seeded so audit trail only records real system activity
  return;
};

module.exports = {
  logActivity,
  seedInitialAuditLogs,
  cleanIp
};
