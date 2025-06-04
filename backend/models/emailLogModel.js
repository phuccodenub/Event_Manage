const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  to: {
    type: String,
    required: [true, 'Email recipient is required'],
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    maxLength: [255, 'Subject too long']
  },
  template: {
    type: String,
    required: [true, 'Email template is required'],
    enum: [
      'email-verification',
      'password-reset',
      'temp-password',
      'event-confirmation',
      'event-reminder',
      'event-update',
      'event-cancelled',
      'new-event',
      'welcome',
      'weekly-digest',
      'test'
    ]
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending',
    index: true
  },
  messageId: {
    type: String,
    sparse: true // Only for successfully sent emails
  },
  error: {
    type: String,
    maxLength: [500, 'Error message too long']
  },
  retryCount: {
    type: Number,
    default: 0,
    min: [0, 'Retry count cannot be negative'],
    max: [5, 'Maximum 5 retry attempts']
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  // Optional: Link to user who received the email
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  // Optional: Link to related event
  relatedEvent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    sparse: true
  },
  // Email metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    }
  }
}, { 
  timestamps: true,
  // Add indexes for better query performance
  indexes: [
    { sentAt: -1 },
    { status: 1, sentAt: -1 },
    { template: 1, sentAt: -1 },
    { to: 1, sentAt: -1 }
  ]
});

// ========== VIRTUAL FIELDS ==========
emailLogSchema.virtual('isSuccessful').get(function() {
  return this.status === 'sent';
});

emailLogSchema.virtual('isFailed').get(function() {
  return this.status === 'failed';
});

emailLogSchema.virtual('canRetry').get(function() {
  return this.status === 'failed' && this.retryCount < 5;
});

emailLogSchema.virtual('timeSinceSent').get(function() {
  if (!this.sentAt) return null;
  return Date.now() - this.sentAt.getTime();
});

// ========== STATIC METHODS ==========

/**
 * Get email statistics
 */
emailLogSchema.statics.getEmailStats = async function(dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  const stats = await this.aggregate([
    {
      $match: {
        sentAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    sent: 0,
    failed: 0,
    pending: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  // Calculate success rate
  result.successRate = result.total > 0 ? 
    ((result.sent / result.total) * 100).toFixed(2) : 0;

  return result;
};

/**
 * Get template usage statistics
 */
emailLogSchema.statics.getTemplateStats = async function(dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  return this.aggregate([
    {
      $match: {
        sentAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$template',
        sent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'sent'] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
          }
        },
        total: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);
};

/**
 * Get failed emails that can be retried
 */
emailLogSchema.statics.getRetryableEmails = async function(limit = 50) {
  return this.find({
    status: 'failed',
    retryCount: { $lt: 5 }
  })
  .sort({ sentAt: 1 }) // Retry oldest failed emails first
  .limit(limit);
};

/**
 * Get email history for a specific recipient
 */
emailLogSchema.statics.getEmailHistory = async function(email, limit = 20) {
  return this.find({ to: email })
    .sort({ sentAt: -1 })
    .limit(limit)
    .select('subject template status sentAt error');
};

/**
 * Get recent email activity
 */
emailLogSchema.statics.getRecentActivity = async function(hours = 24, limit = 100) {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);

  return this.find({
    sentAt: { $gte: startDate }
  })
  .sort({ sentAt: -1 })
  .limit(limit)
  .populate('recipient', 'fullName email')
  .populate('relatedEvent', 'title');
};

// ========== INSTANCE METHODS ==========

/**
 * Mark email as sent
 */
emailLogSchema.methods.markAsSent = function(messageId) {
  this.status = 'sent';
  this.messageId = messageId;
  this.error = undefined;
  return this.save();
};

/**
 * Mark email as failed
 */
emailLogSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.error = errorMessage;
  this.retryCount += 1;
  return this.save();
};

/**
 * Reset for retry
 */
emailLogSchema.methods.resetForRetry = function() {
  if (this.retryCount >= 5) {
    throw new Error('Maximum retry attempts exceeded');
  }
  
  this.status = 'pending';
  this.error = undefined;
  this.sentAt = new Date();
  return this.save();
};

// ========== MIDDLEWARE ==========

// Pre-save middleware to validate retry count
emailLogSchema.pre('save', function(next) {
  if (this.retryCount > 5) {
    return next(new Error('Maximum retry attempts (5) exceeded'));
  }
  next();
});

// Post-save middleware for cleanup
emailLogSchema.post('save', async function(doc) {
  // Auto-cleanup old logs (older than 90 days) when saving new ones
  if (Math.random() < 0.01) { // 1% chance to trigger cleanup
    const cleanupDate = new Date();
    cleanupDate.setDate(cleanupDate.getDate() - 90);
    
    try {
      await this.constructor.deleteMany({
        sentAt: { $lt: cleanupDate }
      });
    } catch (error) {
      console.error('Error during email log cleanup:', error);
    }
  }
});

// ========== COMPOUND INDEXES ==========
emailLogSchema.index({ status: 1, retryCount: 1 }); // For finding retryable emails
emailLogSchema.index({ to: 1, sentAt: -1 }); // For user email history
emailLogSchema.index({ template: 1, status: 1 }); // For template statistics

module.exports = mongoose.model('EmailLog', emailLogSchema); 