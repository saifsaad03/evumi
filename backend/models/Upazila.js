const mongoose = require('mongoose');

const UpazilaSchema = new mongoose.Schema({
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    required: true,
    index: true
  },
  district_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: [true, 'জেলা নির্বাচন আবশ্যক'],
    index: true
  },
  district_name: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'উপজেলার নাম আবশ্যক'],
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

// Prevent duplicate upazila name under same district
UpazilaSchema.index({ district_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Upazila', UpazilaSchema);

