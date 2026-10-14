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
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['User', 'Register Office', 'AC Land Office', 'Super Admin'],
    default: 'User'
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked', 'Pending'],
    default: 'Active'
  },
  office_details: {
    office_name: { type: String },
    designation: { type: String },
    circle: { type: String }
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
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
