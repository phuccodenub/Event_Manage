const mongoose = require('mongoose');

const pendingRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
});

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    default: 'active'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên cộng đồng'],
    maxLength: [100, 'Tên cộng đồng không được vượt quá 100 ký tự'],
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả cộng đồng'],
  },
  avatar: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: 'https://example.com/default-avatar.jpg'
    }
  },
  banner: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: 'https://example.com/default-banner.jpg'
    }
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deputies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [memberSchema],
  pendingRequests: [pendingRequestSchema],
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Tìm kiếm community theo tên
communitySchema.index({ name: 'text' });

module.exports = mongoose.model('Community', communitySchema);