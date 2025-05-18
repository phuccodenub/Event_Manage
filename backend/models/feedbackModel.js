const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  content: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    enum: ['organization', 'content', 'facilities', 'speakers', 'interaction', 'other']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure a user can only provide one feedback per event
FeedbackSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', FeedbackSchema); 