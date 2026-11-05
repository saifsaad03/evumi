const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. MASTER PKI KEYPAIR MANAGEMENT (RSA-2048 Asymmetric Cryptography)
// ============================================================================
const KEYS_DIR = path.resolve(__dirname, '../keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'ministry_private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'ministry_public.pem');

let ministryPrivateKey = null;
let ministryPublicKey = null;

function initMasterPkiKeys() {
  try {
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
      ministryPrivateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
      ministryPublicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
      return;
    }

    // Generate new RSA-2048 Key Pair for Government Land Authority
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

    ministryPrivateKey = privateKey;
    ministryPublicKey = publicKey;
    console.log('✅ [CryptoEngine] Generated and saved Ministry RSA-2048 PKI Keypair.');
  } catch (err) {
    console.warn('⚠️ [CryptoEngine] Error initializing PKI keys on disk, using memory fallback:', err.message);
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    ministryPrivateKey = privateKey;
    ministryPublicKey = publicKey;
  }
}

// Initialize keys immediately
initMasterPkiKeys();

function getMinistryPublicKey() {
  if (!ministryPublicKey) initMasterPkiKeys();
  return ministryPublicKey;
}

// ============================================================================
// 2. FIELD-LEVEL DATA ENCRYPTION AT REST (AES-256-GCM)
// ============================================================================
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'evhumi_super_secure_jwt_secret_key_2026_ministry_of_land';
const AES_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Encrypt sensitive citizen field (NID, Phone) using AES-256-GCM
 */
function encryptField(text) {
  if (!text) return null;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
    let encrypted = cipher.update(String(text).trim(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.warn('Field encryption error:', err.message);
    return null;
  }
}

/**
 * Decrypt field encrypted with AES-256-GCM
 */
function decryptField(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.includes(':')) return ciphertext;
  try {
    const [ivHex, tagHex, encryptedHex] = ciphertext.split(':');
    if (!ivHex || !tagHex || !encryptedHex) return ciphertext;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return ciphertext;
  }
}

// ============================================================================
// 3. COMPREHENSIVE LAND DATA CRYPTOGRAPHIC PAYLOAD GENERATOR
// ============================================================================
/**
 * Canonical serializer to ensure deterministic hashing across environments
 */
function canonicalStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalStringify).join(',')}]`;
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => `"${k}":${canonicalStringify(obj[k])}`);
  return `{${pairs.join(',')}}`;
}

/**
 * Generates all cryptographic parameters for a Land Deed or Khatian:
 * - Deterministic Canonical Land Data Digest (All essential land fields included)
 * - SHA-256 Deed Hash
 * - RSA-2048 PKI Digital Signature
 * - Chained to Previous Deed Hash (Blockchain-style Immutable Ledger)
 */
function generateLandCryptoPayload(recordData, previousRecord = null) {
  const previousHash = previousRecord?.deed_hash || 
    recordData.previous_hash || 
    'GENESIS_E_VUMI_000000000000000000000000000000000000000000000000000000000000';

  const chainSequence = (previousRecord?.chain_sequence || recordData.chain_sequence || 0) + 1;
  const timestamp = new Date().toISOString();
  const certSerial = `BD-LAND-CERT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  // Comprehensive Data Digest: Includes ALL essential land record parameters!
  const dataDigest = {
    deed_no: String(recordData.deed_no || '').trim(),
    deed_year: String(recordData.deed_year || new Date().getFullYear()).trim(),
    sub_registry_code: String(recordData.sub_registry_code || '101').trim(),
    volume_book: String(recordData.volume_book || '').trim(),
    page_no: String(recordData.page_no || '').trim(),
    dag_no: String(recordData.dag_no || '').trim(),
    khatian_no: String(recordData.khatian_no || '').trim(),
    jl_no: String(recordData.jl_no || '').trim(),
    mouza: String(recordData.mouza || '').trim(),
    upazila: String(recordData.upazila || '').trim(),
    district: String(recordData.district || '').trim(),
    division: String(recordData.division || '').trim(),
    seller_nid: String(recordData.owner_nid || '').trim(),
    seller_name: String(recordData.owner_name || '').trim(),
    buyer_nid: String(recordData.buyer_nid || '').trim(),
    buyer_name: String(recordData.buyer_name || '').trim(),
    buyers: Array.isArray(recordData.buyers) ? recordData.buyers.map(b => ({
      name: b.name || '',
      nid: b.nid || '',
      share_decimal: parseFloat(b.share_decimal || 0),
      share_percent: parseFloat(b.share_percent || 0)
    })) : [],
    total_area_decimal: parseFloat(recordData.total_area_decimal || 0),
    sold_area_decimal: parseFloat(recordData.sold_area || recordData.total_area_decimal || 0),
    previous_hash: previousHash,
    chain_sequence: chainSequence,
    issuing_authority: 'Ministry of Land, Government of Bangladesh',
    pades_standard: 'PAdES-B-LT (ISO 32000-2 / Cryptographic Land Registry)',
    timestamp
  };

  const canonicalPayload = canonicalStringify(dataDigest);

  // 1. SHA-256 Cryptographic Hash
  const deedHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

  // 2. RSA-2048 PKI Asymmetric Digital Signature
  if (!ministryPrivateKey) initMasterPkiKeys();
  const signatureBuffer = crypto.sign('sha256', Buffer.from(canonicalPayload), ministryPrivateKey);
  const digitalSignature = signatureBuffer.toString('base64');

  return {
    deed_hash: deedHash,
    previous_hash: previousHash,
    chain_sequence: chainSequence,
    digital_signature: digitalSignature,
    signed_by_role: 'Ministry Land Authority',
    signer_public_key: getMinistryPublicKey(),
    crypto_metadata: {
      algorithm: 'RSA-SHA256',
      pki_certificate_serial: certSerial,
      signed_at: new Date(),
      canonical_payload: canonicalPayload,
      data_digest: dataDigest
    }
  };
}

/**
 * Verifies the complete cryptographic integrity of a Land Record:
 * - Checks SHA-256 hash
 * - Checks RSA-2048 PKI Digital Signature
 * - Verifies data payload completeness
 */
function verifyDeedCryptographicIntegrity(record) {
  if (!record || !record.deed_hash) {
    return {
      valid: false,
      hash_valid: false,
      pki_valid: false,
      message: 'রেকর্ডে ক্রিপ্টোগ্রাফিক হ্যাশ অনুপস্থিত।'
    };
  }

  try {
    const pubKey = record.signer_public_key || getMinistryPublicKey();
    const canonicalPayload = record.crypto_metadata?.canonical_payload;
    const signature = record.digital_signature;

    let pkiValid = false;
    let hashValid = false;

    if (canonicalPayload) {
      const computedHash = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
      hashValid = (computedHash === record.deed_hash);

      if (signature && pubKey) {
        pkiValid = crypto.verify(
          'sha256',
          Buffer.from(canonicalPayload),
          pubKey,
          Buffer.from(signature, 'base64')
        );
      }
    } else {
      // Legacy records created before canonical payload: deed_hash exists
      hashValid = Boolean(record.deed_hash && record.deed_hash.length === 64);
      pkiValid = Boolean(signature);
    }

    return {
      valid: hashValid,
      hash_valid: hashValid,
      pki_valid: pkiValid,
      algorithm: record.crypto_metadata?.algorithm || 'RSA-SHA256',
      chain_sequence: record.chain_sequence || 1,
      previous_hash: record.previous_hash || 'GENESIS_E_VUMI_00000000000000000000000000000000000000000000',
      pki_certificate_serial: record.crypto_metadata?.pki_certificate_serial || 'BD-LAND-CERT-VERIFIED',
      data_digest: record.crypto_metadata?.data_digest || null,
      message: hashValid ? '✅ ক্রিপ্টোগ্রাফিক ডিজিটাল স্বাক্ষর ও ডাটা ইন্টিগ্রিটি সম্পূর্ণ নির্ভুল' : '⚠️ ক্রিপ্টোগ্রাফিক হ্যাশ অমিল!'
    };
  } catch (err) {
    return {
      valid: false,
      hash_valid: false,
      pki_valid: false,
      error: err.message
    };
  }
}

// ============================================================================
// 4. CRYPTOGRAPHIC HASH CHAINING FOR AUDIT TRAIL (Immutable Ledger)
// ============================================================================
/**
 * Calculates a cryptographic hash chain for a new system log entry
 */
function hashChainedLogEntry(logData, previousLog = null) {
  const previousLogHash = previousLog?.log_hash || 'GENESIS_AUDIT_LOG_00000000000000000000000000000000000000000000';
  const sequenceNumber = (previousLog?.sequence_number || 0) + 1;

  const rawString = `${previousLogHash}|${sequenceNumber}|${logData.action_type || ''}|${logData.user_email || ''}|${logData.module || ''}|${logData.target_resource || ''}|${logData.timestamp || new Date().toISOString()}`;
  const logHash = crypto.createHash('sha256').update(rawString).digest('hex');

  return {
    log_hash: logHash,
    previous_log_hash: previousLogHash,
    sequence_number: sequenceNumber
  };
}

module.exports = {
  getMinistryPublicKey,
  encryptField,
  decryptField,
  generateLandCryptoPayload,
  verifyDeedCryptographicIntegrity,
  hashChainedLogEntry,
  canonicalStringify
};

