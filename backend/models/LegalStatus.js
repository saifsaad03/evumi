const mongoose = require('mongoose');

const LegalStatusSchema = new mongoose.Schema({
  dag_no: { type: String, required: true },
  mouza: { type: String },
  jl_no: { type: String },
  is_khas: { type: Boolean, default: false },
  has_court_case: { type: Boolean, default: false },
  case_details: { type: String },
  khas_reason: { type: String },
  stay_order: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('LegalStatus', LegalStatusSchema);
