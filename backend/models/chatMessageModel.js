const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachment: {
    url: String,
    filename: String,
    size: Number,
    mimetype: String,
    public_id: String // For Cloudinary
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ communityId: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1, createdAt: -1 });

// Virtual for formatted timestamp
chatMessageSchema.virtual('timestamp').get(function() {
  return this.createdAt;
});

// Don't include deleted messages by default
chatMessageSchema.pre(/^find/, function() {
  this.find({ deleted: { $ne: true } });
});

// Populate sender info by default
chatMessageSchema.pre(/^find/, function() {
  this.populate({
    path: 'sender',
    select: 'fullName avatar'
  });
});

// Method to soft delete message
chatMessageSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to edit message
chatMessageSchema.methods.editContent = function(newContent) {
  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();
  return this.save();
};

// Static method to get community messages with pagination
chatMessageSchema.statics.getCommunityMessages = async function(communityId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ communityId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('replyTo')
    .lean();
    
  const total = await this.countDocuments({ communityId });
  
  return {
    messages: messages.reverse(), // Reverse to show oldest first
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Static method to get latest messages for multiple communities
chatMessageSchema.statics.getLatestMessages = async function(communityIds, limit = 10) {
  return this.find({ 
    communityId: { $in: communityIds } 
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 