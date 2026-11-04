const mongoose = require('mongoose');

const MouzaSchema = new mongoose.Schema({
  division_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Division',
    index: true
  },
  district_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    index: true
  },
  upazila_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upazila',
    required: [true, 'উপজেলা নির্বাচন আবশ্যক'],
    index: true
  },
  upazila_name: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'মৌজার নাম আবশ্যক'],
    trim: true
  },
  jl_no: {
    type: String,
    required: [true, 'জে.এল নম্বর আবশ্যক'],
    trim: true
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

// Prevent duplicate mouza name under same upazila
MouzaSchema.index({ upazila_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Mouza', MouzaSchema);

