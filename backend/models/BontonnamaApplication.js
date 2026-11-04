const mongoose = require('mongoose');

const BontonnamaApplicationSchema = new mongoose.Schema({
  application_no: { type: String, unique: true, required: true },

  // Deceased Owner Information
  deceased_nid: { type: String, required: true, trim: true },
  deceased_name: { type: String, required: true, trim: true },
  death_certificate_no: { type: String, required: true, trim: true },
  death_date: { type: Date },

  // Target Land Details (Standard: Mouza + Dag + Khatian)
  land_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord', required: true },
  division: { type: String, default: 'রাজশাহী' },
  district: { type: String, default: 'বগুড়া' },
  upazila: { type: String, default: 'শিবগঞ্জ' },
  mouza: { type: String, required: true, trim: true },
  jl_no: { type: String, required: true, trim: true },
  khatian_no: { type: String, required: true, trim: true },
  dag_no: { type: String, required: true, trim: true },
  total_area_decimal: { type: Number, required: true },
  allocated_area_decimal: { type: Number, required: true },

  // Heirs List (Partial Owners)
  heirs: [
    {
      user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      nid: { type: String, required: true, trim: true },
      name: { type: String, required: true, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      relationship: { type: String, default: 'ওয়ারিশ', trim: true },
      share_decimal: { type: Number, required: true },
      share_percent: { type: Number },
      nid_verified: { type: Boolean, default: true },
      otp_verified: { type: Boolean, default: true },
      fingerprint_verified: { type: Boolean, default: true }
    }
  ],

  // Registry Office Submitter
  sub_registry_office: { type: String, default: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস' },
  submitted_by_officer: { type: String, default: 'সাব-রেজিস্ট্রার' },
  submitted_by_nid: { type: String },
  otp_code: { type: String },

  // AC Land Office Workflow & Payment
  status: {
    type: String,
    enum: ['Pending_AC_Land_Review', 'Payment_Pending', 'Approved', 'Rejected'],
    default: 'Pending_AC_Land_Review'
  },
  payment_status: {
    type: String,
    enum: ['Unpaid', 'Paid'],
    default: 'Unpaid'
  },
  mutation_fee: { type: Number, default: 1150 },
  payment_transaction_id: { type: String },
  ac_land_reviewed_by: { type: String },
  ac_land_reviewed_at: { type: Date },
  rejection_reason: { type: String },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BontonnamaApplication', BontonnamaApplicationSchema);

