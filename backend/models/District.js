const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: [true, 'বিভাগ নির্বাচন আবশ্যক'],
    index: true
  },
  division_name: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'জেলার নাম আবশ্যক'],
    trim: true
  },
  code: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Prevent duplicate district name under same division
DistrictSchema.index({ division_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('District', DistrictSchema);

