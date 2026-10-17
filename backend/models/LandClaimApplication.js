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

  // Application Status: 1. অপেক্ষমান 2. অনুমোদিত 3. আবেদন খারিজ করা হলো
  status: {
    type: String,
    enum: ['অপেক্ষমান', 'অনুমোদিত', 'আবেদন খারিজ করা হলো', 'Pending_Review', 'Notified', 'Completed'],
    default: 'অপেক্ষমান'
  },
  reviewed_by: { type: String },
  reviewed_at: { type: Date },
  review_remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LandClaimApplication', LandClaimApplicationSchema);
