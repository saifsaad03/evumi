const mongoose = require('mongoose');

const OtherDeedApplicationSchema = new mongoose.Schema({
  application_no: { type: String, unique: true, required: true },
  deed_type: { 
    type: String, 
    enum: ['Heba', 'Exchange', 'Mortgage', 'Bayna'], 
    required: true 
  },
  sub_registry_office: { type: String, default: 'শিবগঞ্জ সাব-রেজিস্ট্রি অফিস' },
  sub_registry_code: { type: String, default: 'SRO-BOG-SG-01' },
  deed_no: { type: String, required: true },
  deed_year: { type: String, default: () => new Date().getFullYear().toString() },
  deed_hash: { type: String },
  qr_code_id: { type: String },

  // Status Lifecycle
  status: {
    type: String,
    enum: [
      'Pending_AC_Land_Review', 
      'Payment_Pending', 
      'Approved', 
      'Rejected', 
      'Locked', 
      'Unlocked'
    ],
    default: 'Pending_AC_Land_Review'
  },

  // 1. Heba Deed Fields
  heba: {
    donor_nid: { type: String },
    donor_name: { type: String },
    donor_phone: { type: String },
    donor_email: { type: String },
    land_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord' },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    mouza: { type: String },
    jl_no: { type: String },
    khatian_no: { type: String },
    dag_no: { type: String },
    donor_total_area: { type: Number },
    gift_area_decimal: { type: Number },
    remaining_donor_area: { type: Number },
    recipient_nid: { type: String },
    recipient_name: { type: String },
    recipient_phone: { type: String },
    recipient_email: { type: String },
    relationship: { type: String },
    relationship_verified: { type: Boolean, default: false },
    donor_otp_verified: { type: Boolean, default: false },
    donor_biometric_verified: { type: Boolean, default: false },
    recipient_otp_verified: { type: Boolean, default: false }
  },

  // 2. Exchange Deed Fields
  exchange: {
    owner1: {
      nid: { type: String },
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      land_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord' },
      division: { type: String },
      district: { type: String },
      upazila: { type: String },
      mouza: { type: String },
      jl_no: { type: String },
      khatian_no: { type: String },
      dag_no: { type: String },
      area_decimal: { type: Number },
      otp_verified: { type: Boolean, default: false },
      biometric_verified: { type: Boolean, default: false }
    },
    owner2: {
      nid: { type: String },
      name: { type: String },
      phone: { type: String },
      email: { type: String },
      land_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord' },
      division: { type: String },
      district: { type: String },
      upazila: { type: String },
      mouza: { type: String },
      jl_no: { type: String },
      khatian_no: { type: String },
      dag_no: { type: String },
      area_decimal: { type: Number },
      otp_verified: { type: Boolean, default: false },
      biometric_verified: { type: Boolean, default: false }
    },
    declaration_text: { type: String }
  },

  // 3. Mortgage Deed Fields
  mortgage: {
    owner_nid: { type: String },
    owner_name: { type: String },
    owner_phone: { type: String },
    owner_email: { type: String },
    land_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord' },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    mouza: { type: String },
    jl_no: { type: String },
    khatian_no: { type: String },
    dag_no: { type: String },
    total_area_decimal: { type: Number },
    mortgagee_nid: { type: String },
    mortgagee_name: { type: String },
    mortgagee_phone: { type: String },
    mortgagee_email: { type: String },
    loan_amount: { type: Number },
    mortgage_date: { type: Date, default: Date.now },
    owner_otp_verified: { type: Boolean, default: false },
    owner_biometric_verified: { type: Boolean, default: false },
    unlocked_at: { type: Date },
    unlocked_by_nid: { type: String },
    unlock_otp_verified: { type: Boolean, default: false },
    unlock_biometric_verified: { type: Boolean, default: false }
  },

  // 4. Bayna Deed Fields
  bayna: {
    seller_nid: { type: String },
    seller_name: { type: String },
    seller_phone: { type: String },
    seller_email: { type: String },
    land_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LandRecord' },
    division: { type: String },
    district: { type: String },
    upazila: { type: String },
    mouza: { type: String },
    jl_no: { type: String },
    khatian_no: { type: String },
    dag_no: { type: String },
    total_area_decimal: { type: Number },
    bayna_buyer_nid: { type: String },
    bayna_buyer_name: { type: String },
    bayna_buyer_phone: { type: String },
    bayna_buyer_email: { type: String },
    bayna_amount: { type: Number },
    total_agreed_price: { type: Number },
    bayna_date: { type: Date, default: Date.now },
    expiry_date: { type: Date },
    seller_otp_verified: { type: Boolean, default: false },
    seller_biometric_verified: { type: Boolean, default: false },
    unlocked_at: { type: Date },
    unlocked_by_nid: { type: String },
    unlock_otp_verified: { type: Boolean, default: false },
    unlock_biometric_verified: { type: Boolean, default: false }
  },

  // Fee & Payment
  mutation_fee: { type: Number, default: 1150 },
  payment_status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
  payment_transaction_id: { type: String },
  paid_at: { type: Date },

  // Administrative Review
  submitted_by_officer: { type: String, default: 'সাব-রেজিস্ট্রার' },
  submitted_by_nid: { type: String },
  ac_land_reviewed_by: { type: String },
  ac_land_reviewed_at: { type: Date },
  rejection_reason: { type: String },
  remarks: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('OtherDeedApplication', OtherDeedApplicationSchema);

