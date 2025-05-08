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
  administrators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  eventManagers: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Middleware để đảm bảo không có trùng lặp users trong các roles
departmentSchema.pre('save', function(next) {
  // Remove duplicates
  this.administrators = [...new Set(this.administrators)];
  this.moderators = [...new Set(this.moderators)];
  next();
});

module.exports = mongoose.model('Department', departmentSchema);

