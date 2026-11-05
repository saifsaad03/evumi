const mongoose = require('mongoose');

const SystemLogSchema = new mongoose.Schema({
  user_id: {
    type: String,
    default: null
  },
  user_name: {
    type: String,
    required: true,
    default: 'সিস্টেম'
  },
  user_email: {
    type: String,
    default: ''
  },
  user_role: {
    type: String,
    enum: ['User', 'Register Office', 'AC Land Office', 'Super Admin', 'System'],
    default: 'System',
    index: true
  },
  user_nid: {
    type: String,
    default: ''
  },
  action_type: {
    type: String,
    required: true,
    index: true
  },
  module: {
    type: String,
    required: true,
    enum: [
      'Auth',
      'Profile',
      'Deed_Registry',
      'Bonton_Nama',
      'Mutation',
      'Land_Assignment',
      'Land_Claim',
      'Legal_Case',
      'User_Management',
      'Land_Management',
      'OTP_Service',
      'System'
    ],
    index: true
  },
  description: {
    type: String,
    required: true
  },
  target_resource: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ip_address: {
    type: String,
    default: '127.0.0.1'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'WARNING', 'INFO'],
    default: 'SUCCESS'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Cryptographic Chained Audit Trail (Immutable Ledger)
  log_hash: {
    type: String,
    default: null,
    index: true
  },
  previous_log_hash: {
    type: String,
    default: null
  },
  sequence_number: {
    type: Number,
    default: 1,
    index: true
  }
}, {
  timestamps: true
});

SystemLogSchema.index({ user_role: 1, timestamp: -1 });
SystemLogSchema.index({ module: 1, timestamp: -1 });
SystemLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SystemLog', SystemLogSchema);

