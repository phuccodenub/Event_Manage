const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'attended'],
    default: 'pending'
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  attendanceTime: {
    type: Date
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  formData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Change from String to Mixed to support arrays
    default: () => new Map() // Make sure to initialize as empty Map
  }
}, { timestamps: true });

// Add toJSON transform
registrationSchema.set('toJSON', {
  transform: function(doc, ret) {
    if (ret.formData) {
      ret.formResponses = Object.fromEntries(ret.formData);
      delete ret.formData;
    }
    return ret;
  }
});

// Ensure one user can only register once for an event
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
