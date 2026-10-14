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
    enum: ['Active', 'Pending_Mutation', 'Sold', 'Pending_AC_Land_Review'],
    default: 'Active'
  },
  // Sub-Registry deed & volume book fields
  volume_book: { type: String },
  page_no: { type: String },
  deed_no: { type: String },
  deed_year: { type: String },
  sub_registry_code: { type: String },
  deed_hash: { type: String }, // SHA-256
  qr_code_id: { type: String },
  buyer_nid: { type: String },
  buyer_name: { type: String },
  buyer_phone: { type: String },
  buyer_email: { type: String },
  payment_status: { type: String, enum: ['Pending', 'Paid', null], default: null },
  namjari_issued: { type: Boolean, default: false },
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
