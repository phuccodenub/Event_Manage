const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter department name'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please enter department code'],
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  head: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  eventManagers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);

