const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Thay đổi thành false
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  checkinMethod: {
    type: String,
    enum: ['qr', 'manual'],
    required: true
  },
  checkinTime: {
    type: Date,
    default: Date.now
  },
  wasRegistered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Chỉ giữ lại index unique cho studentId

module.exports = mongoose.model('Checkin', checkinSchema);
