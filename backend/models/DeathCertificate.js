const mongoose = require('mongoose');

const DeathCertificateSchema = new mongoose.Schema({
  certificate_no: { type: String, required: true, unique: true, trim: true },
  deceased_nid: { type: String, required: true, trim: true },
  deceased_name: { type: String, required: true, trim: true },
  deceased_phone: { type: String, trim: true },
  deceased_email: { type: String, trim: true },
  death_date: { type: Date, required: true },
  cause_of_death: { type: String, trim: true },
  issuing_authority: { type: String, default: 'সিটি কর্পোরেশন / ইউনিয়ন পরিষদ', trim: true },
  applicant_heir_name: { type: String, required: true, trim: true },
  applicant_heir_nid: { type: String, required: true, trim: true },
  applicant_heir_phone: { type: String, required: true, trim: true },
  relationship_with_deceased: { type: String, default: 'ওয়ারিশ', trim: true },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Approved' // Register Office verifies and approves
  },
  approved_by: { type: String, default: 'সাব-রেজিস্ট্রার' },
  approved_at: { type: Date, default: Date.now },
  locked_lands_count: { type: Number, default: 0 },
  remarks: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('DeathCertificate', DeathCertificateSchema);

