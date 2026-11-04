const mongoose = require('mongoose');

const DivisionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'বিভাগের নাম আবশ্যক'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    trim: true,
    default: ''
  },
  bn_name: {
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

module.exports = mongoose.model('Division', DivisionSchema);

