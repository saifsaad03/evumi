const mongoose = require('mongoose');

const LandAssignRequestSchema = new mongoose.Schema({
  request_id: { type: String, unique: true },
  
  // Land Details
  land_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord' },
  division: { type: String, required: true },
  district: { type: String, required: true },
  upazila: { type: String, required: true },
  mouza: { type: String, required: true },
  jl_no: { type: String, required: true },
  khatian_no: { type: String, required: true },
  dag_no: { type: String, required: true },
  area_decimal: { type: Number, required: true },

  // Registration Book details
  volume_book: { type: String, required: true }, // ভলিউম বই নম্বর
  page_no: { type: String, required: true },     // পৃষ্ঠা নম্বর
  deed_no: { type: String },                     // দলিল নম্বর

  // Assigned Target User (Citizen)
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_nid: { type: String, required: true },
  user_name: { type: String, required: true },
  user_phone: { type: String },
  user_email: { type: String },

  // Register Office submitter
  submitted_by_officer: { type: String, default: 'সাব-রেজিস্ট্রার' },
  submitted_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sub_registry_office: { type: String, default: 'সদর সাব-রেজিস্ট্রি অফিস' },

  // Workflow status
  status: {
    type: String,
    enum: ['Pending_AC_Land_Review', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending_AC_Land_Review'
  },
  
  // AC Land review notes
  ac_land_reviewed_by: { type: String },
  ac_land_reviewed_at: { type: Date },
  rejection_reason: { type: String },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LandAssignRequest', LandAssignRequestSchema);
