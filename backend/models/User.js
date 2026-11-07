const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  father_name: { type: String, required: true, trim: true },
  mother_name: { type: String, required: true, trim: true },
  nid: { type: String, required: true, unique: true, trim: true },
  division: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  upazila: { type: String, required: true, trim: true },
  mouza: { type: String, default: '', trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['User', 'Institution', 'Register Office', 'AC Land Office', 'Super Admin'],
    default: 'User'
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked', 'Pending', 'Deceased'],
    default: 'Active'
  },
  // Deceased landowner tracking
  is_deceased: { type: Boolean, default: false },
  death_certificate_no: { type: String, default: null, trim: true },
  death_date: { type: Date, default: null },
  death_verified_at: { type: Date, default: null },
  death_verified_by: { type: String, default: null },
  office_details: {
    office_name: { type: String },
    designation: { type: String },
    circle: { type: String }
  },
  // Field-Level Encryption at Rest (AES-256-GCM)
  nid_encrypted: { type: String, default: null },
  phone_encrypted: { type: String, default: null }
}, { timestamps: true });

// Hash password and encrypt sensitive fields at rest before saving
UserSchema.pre('save', async function (next) {
  try {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    // AES-256-GCM Encryption at rest for NID & Phone
    if (this.nid && (!this.nid_encrypted || this.isModified('nid'))) {
      try {
        const { encryptField } = require('../utils/cryptoEngine');
        this.nid_encrypted = encryptField(this.nid);
      } catch (e) {}
    }
    if (this.phone && (!this.phone_encrypted || this.isModified('phone'))) {
      try {
        const { encryptField } = require('../utils/cryptoEngine');
        this.phone_encrypted = encryptField(this.phone);
      } catch (e) {}
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
