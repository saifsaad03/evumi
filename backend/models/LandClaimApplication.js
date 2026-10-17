const mongoose = require('mongoose');

const LandClaimApplicationSchema = new mongoose.Schema({
  claim_id: { type: String, unique: true },
  
  // Citizen Information (Auto-filled from profile)
  applicant_name: { type: String, required: true },
  applicant_nid: { type: String, required: true },
  applicant_phone: { type: String },
  applicant_email: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Land Location Details (Shibganj, Bogura)
  division: { type: String, default: 'রাজশাহী' },
  district: { type: String, default: 'বগুড়া' },
  upazila: { type: String, default: 'শিবগঞ্জ' },
  mouza: { type: String, required: true },
  dag_no: { type: String, required: true },
  khatian_no: { type: String, required: true },

  // Previous Online Assignment Status
  // "বর্টমানে এই জমির অনলাইন নিবন্ধন অন্য কারো নামে ভুলভাবেASSIGN হয়ে আছে কি?"
  previous_assignment_status: { 
    type: String, 
    required: true 
  },

  // Official Declaration Text
  declaration_text: { type: String, required: true },

  // Notification Status (Read-only on registrar end)
  status: {
    type: String,
    enum: ['Pending_Review', 'Notified', 'Completed'],
    default: 'Pending_Review'
  },
  status_label: {
    type: String,
    default: 'বিজ্ঞপ্তি প্রেরিত (অবহিতকরণ)'
  }
}, { timestamps: true });

module.exports = mongoose.model('LandClaimApplication', LandClaimApplicationSchema);
