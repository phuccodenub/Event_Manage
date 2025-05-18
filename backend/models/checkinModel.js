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
  },
  type: {
    type: String,
    enum: ['participant', 'collaborator'],
    required: true,
    default: 'participant'
  }
}, {
  timestamps: true
});

// Create a compound index to ensure a user cannot check in multiple times for the same event and same type
checkinSchema.index({ event: 1, studentId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Checkin', checkinSchema);
