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
  slug: {
    type: String,
    unique: true,
    index: true
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
      default: '/default-community.png'
    }
  },
  banner: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: '/default-banner.png'
    }
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdBy: {
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

// Tạo slug từ name trước khi save
communitySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('name')) {
    // Tạo slug từ name
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Remove special characters
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/-+/g, '-')         // Replace multiple - with single -
      .trim('-');                  // Remove leading/trailing -

    // Đảm bảo slug unique
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingCommunity = await mongoose.model('Community').findOne({ 
        slug: slug,
        _id: { $ne: this._id } // Exclude current document
      });
      
      if (!existingCommunity) {
        break;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Tìm kiếm community theo tên
communitySchema.index({ name: 'text' });

module.exports = mongoose.model('Community', communitySchema);