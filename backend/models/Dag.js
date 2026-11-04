const mongoose = require('mongoose');

const DagSchema = new mongoose.Schema({
  mouza_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mouza',
    required: [true, 'মৌজা নির্বাচন আবশ্যক'],
    index: true
  },
  mouza_name: {
    type: String,
    required: true,
    trim: true
  },
  dag_no: {
    type: String,
    required: [true, 'দাগ নম্বর আবশ্যক'],
    trim: true
  },
  land_type: {
    type: String,
    default: 'নাল / কৃষি জমি',
    trim: true
  },
  total_area_decimal: {
    type: Number,
    default: 10,
    min: [0.01, 'জমির পরিমাণ শূন্যের বেশি হতে হবে']
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

// Prevent duplicate dag number under same mouza
DagSchema.index({ mouza_id: 1, dag_no: 1 }, { unique: true });

module.exports = mongoose.model('Dag', DagSchema);

