const mongoose = require('mongoose');

const LandRecordSchema = new mongoose.Schema({
  record_id: { type: String, unique: true },
  division: { type: String, default: 'ঢাকা' },
  district: { type: String, default: 'ঢাকা' },
  upazila: { type: String, default: 'ধানমন্ডি' },
  mouza: { type: String, required: true },
  jl_no: { type: String, required: true },
  khatian_no: { type: String, required: true },
  dag_no: { type: String, required: true },
  owner_nid: { type: String, required: true },
  owner_name: { type: String, required: true },
  owner_phone: { type: String },
  owner_email: { type: String },
  total_area_decimal: { type: Number, required: true },
  available_area_decimal: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      'Active', 
      'Pending_Mutation', 
      'Sold', 
      'Pending_AC_Land_Review', 
      'Deceased_Locked', 
      'Transferred_To_Heirs',
      'Mortgage_Locked',
      'Bayna_Locked',
      'Pending_Heba_Review',
      'Pending_Exchange_Review'
    ],
    default: 'Active'
  },
  mutation_source: { type: String, default: 'ক্রয়/সাধারণ সূত্রে নামজারি' },
  mortgage_details: {
    is_mortgaged: { type: Boolean, default: false },
    mortgagee_nid: { type: String },
    mortgagee_name: { type: String },
    mortgagee_phone: { type: String },
    mortgagee_email: { type: String },
    loan_amount: { type: Number },
    mortgage_date: { type: Date },
    mortgage_deed_no: { type: String },
    unlocked_at: { type: Date }
  },
  bayna_details: {
    is_bayna_locked: { type: Boolean, default: false },
    bayna_buyer_nid: { type: String },
    bayna_buyer_name: { type: String },
    bayna_buyer_phone: { type: String },
    bayna_buyer_email: { type: String },
    bayna_amount: { type: Number },
    bayna_date: { type: Date },
    bayna_deed_no: { type: String },
    unlocked_at: { type: Date }
  },
  exchange_details: {
    exchanged_with_nid: { type: String },
    exchanged_with_name: { type: String },
    exchanged_with_dag: { type: String },
    exchanged_with_khatian: { type: String },
    exchange_deed_no: { type: String }
  },
  transfer_history: [
    {
      title: { type: String },
      date: { type: Date, default: Date.now },
      details: { type: String },
      deed_no: { type: String },
      source_type: { type: String }
    }
  ],
  // Deceased owner and Bonton Nama fields
  is_deceased_locked: { type: Boolean, default: false },
  deceased_owner_nid: { type: String },
  bonton_status: {
    type: String,
    enum: ['None', 'Locked', 'Pending_AC_Land', 'Distributed'],
    default: 'None'
  },
  inheritance_source: { type: String },
  // Sub-Registry deed & volume book fields
  volume_book: { type: String },
  page_no: { type: String },
  deed_no: { type: String },
  deed_year: { type: String },
  sub_registry_code: { type: String },
  deed_hash: { type: String }, // SHA-256
  qr_code_id: { type: String },
  // Enterprise Cryptography & Blockchain Ledger
  previous_hash: { type: String, default: 'GENESIS_E_VUMI_00000000000000000000000000000000000000000000' },
  chain_sequence: { type: Number, default: 1 },
  digital_signature: { type: String, default: null }, // RSA-2048 PKI signature
  signed_by_role: { type: String, default: 'Ministry Land Authority' },
  signer_public_key: { type: String, default: null },
  crypto_metadata: {
    algorithm: { type: String, default: 'RSA-SHA256' },
    pki_certificate_serial: { type: String, default: null },
    signed_at: { type: Date, default: null },
    canonical_payload: { type: String, default: null },
    data_digest: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  buyer_nid: { type: String },
  buyer_name: { type: String },
  buyer_phone: { type: String },
  buyer_email: { type: String },
  sold_area: { type: Number },
  is_joint_ownership: { type: Boolean, default: false },
  parent_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord' },
  buyers: [
    {
      name: { type: String },
      nid: { type: String },
      phone: { type: String },
      email: { type: String },
      share_decimal: { type: Number },
      share_percent: { type: Number }
    }
  ],
  co_owners: [
    {
      name: { type: String },
      nid: { type: String },
      phone: { type: String },
      email: { type: String },
      share_decimal: { type: Number },
      share_percent: { type: Number }
    }
  ],
  payment_status: { type: String, enum: ['Pending', 'Paid', null], default: null },
  namjari_issued: { type: Boolean, default: false },
  remarks: { type: String },
  // P3 audit log embedded
  fraud_alerts: [
    {
      type: { type: String },
      message: { type: String },
      triggered_at: { type: Date, default: Date.now },
      attempted_nid: { type: String }
    }
  ],
  last_updated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LandRecord', LandRecordSchema);
