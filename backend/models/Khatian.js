const mongoose = require('mongoose');

const KhatianSchema = new mongoose.Schema({
  dag_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dag',
    required: [true, 'দাগ নম্বর নির্বাচন আবশ্যক'],
    index: true
  },
  dag_no: {
    type: String,
    required: true,
    trim: true
  },
  mouza_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mouza',
    index: true
  },
  mouza_name: {
    type: String,
    trim: true,
    default: ''
  },
  khatian_no: {
    type: String,
    required: [true, 'খতিয়ান নম্বর আবশ্যক'],
    trim: true
  },
  khatian_type: {
    type: String,
    default: 'বিএস (BS)',
    trim: true
  },
  owner_name: {
    type: String,
    trim: true,
    default: 'বাংলাদেশ সরকার (১নং খাস খতিয়ান)'
  },
  owner_nid: {
    type: String,
    trim: true,
    default: ''
  },
  area_decimal: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Prevent duplicate khatian number under same dag
KhatianSchema.index({ dag_id: 1, khatian_no: 1 }, { unique: true });

module.exports = mongoose.model('Khatian', KhatianSchema);

