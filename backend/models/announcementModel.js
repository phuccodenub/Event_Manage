const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide content']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['general', 'academic', 'event', 'news', 'urgent']
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  images: [{
    public_id: String,
    url: String
  }],
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.ObjectId,
    ref: 'Department',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for sorting and filtering
announcementSchema.index({ createdAt: -1, priority: -1 });

// Method to check if announcement is expired
announcementSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

module.exports = mongoose.model('Announcement', announcementSchema);
