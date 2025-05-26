const mongoose = require('mongoose');
const cron = require('node-cron');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter event title'],
    trim: true
  },
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    }
  }],
  description: {
    type: String,
    required: [true, 'Please enter event description']
  },
  speakers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  eventType: {
    type: String,
    enum: ['offline', 'online', 'hybrid'],
    required: true,
    default: 'offline'
  },
  location: {
    physical: {
      address: String,
      room: String
    },
    online: {
      platform: {
        type: String,
        enum: ['Zoom', 'Google Meet', 'Microsoft Teams', 'Other'],
      },
      meetingLink: String,
      meetingId: String,
      password: String
    }
  },
  maxParticipants: {
    offline: Number,
    online: Number
  },
  eventDays: [{
    date: {
      type: Date,
      required: true
    },
    sessions: [{
      type: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'custom'],
        required: true
      },
      startTime: {
        type: String, // Format: "HH:mm"
        required: true
      },
      endTime: {
        type: String, // Format: "HH:mm"
        required: true
      },
      label: {
        type: String, // Tên buổi tự custom
        default: function() {
          switch(this.type) {
            case 'morning': return 'Buổi Sáng';
            case 'afternoon': return 'Buổi Chiều';
            case 'evening': return 'Buổi Tối';
            default: return 'Buổi tự chọn';
          }
        }
      }
    }]
  }],
  startDate: {
    type: Date,
    get: function() {
      if (this.eventDays && this.eventDays.length > 0) {
        const firstDay = this.eventDays[0];
        if (firstDay.sessions && firstDay.sessions.length > 0) {
          const firstSession = firstDay.sessions[0];
          const date = new Date(firstDay.date);
          const [hours, minutes] = firstSession.startTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return date;
        }
        return firstDay.date;
      }
      return null;
    }
  },
  endDate: {
    type: Date,
    get: function() {
      if (this.eventDays && this.eventDays.length > 0) {
        const lastDay = this.eventDays[this.eventDays.length - 1];
        if (lastDay.sessions && lastDay.sessions.length > 0) {
          const lastSession = lastDay.sessions[lastDay.sessions.length - 1];
          const date = new Date(lastDay.date);
          const [hours, minutes] = lastSession.endTime.split(':');
          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          return date;
        }
        return lastDay.date;
      }
      return null;
    }
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  setupTime: {
    supportDays: [{
      date: {
        type: Date,
        required: true
      },
      sessions: [{
        type: {
          type: String,
          enum: ['morning', 'afternoon', 'evening', 'custom'],
          required: true
        },
        startTime: {
          type: String, // Format: "HH:mm"
          required: true
        },
        endTime: {
          type: String, // Format: "HH:mm"
          required: true
        },
        label: {
          type: String,
          default: function() {
            switch(this.type) {
              case 'morning': return 'Buổi Sáng';
              case 'afternoon': return 'Buổi Chiều';
              case 'evening': return 'Buổi Tối';
              default: return 'Buổi tự chọn';
            }
          }
        }
      }]
    }]
  },
  collaborators: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      selectedShifts: [{
        date: {
          type: Date,
          required: true
        },
        session: {
          type: String,
          required: true
        }
      }],
      formData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: new Map()
      },
      requestedAt: {
        type: Date,
        default: Date.now
      },
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      text: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  shares: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
    // public: visible to everyone (for general events) or to all users (for community events)
    // private: only visible to community members (for community events)  
    // restricted: admin-only or special access
  },
  category: {
    type: String,
    enum: ['academic', 'cultural', 'sports', 'workshop','career', 'seminar', 'other'],
    required: [true, 'Please select event category']
  },
  registrationDeadline: {
    type: Date
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1'],
    default: 0 // 0 means unlimited
  },
  isRegistrationRequired: {
    type: Boolean,
    default: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  needsRegistrationForm: {
    type: Boolean,
    default: false
  },
  registrationForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RegistrationForm'
  },
  needsCollaboratorForm: {
    type: Boolean,
    default: false
  },
  collaboratorForm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollaboratorForm'
  },
  needsVolunteers: {
    type: Boolean,
    default: false
  },
  maxVolunteers: {
    type: Number,
    default: 0
  },
  // Community event fields
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null // null means it's a general event, not community-specific
  },
  eventScope: {
    type: String,
    enum: ['general', 'community'],
    default: 'general'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Validate location based on eventType
eventSchema.pre('save', function(next) {
  if (this.eventType === 'offline' && !this.location.physical) {
    throw new Error('Physical location is required for offline events');
  }
  if (this.eventType === 'online' && !this.location.online) {
    throw new Error('Online meeting details are required for online events');
  }
  if (this.eventType === 'hybrid') {
    if (!this.location.physical || !this.location.online) {
      throw new Error('Both physical and online locations are required for hybrid events');
    }
  }
  next();
});

// Add validation for capacity
eventSchema.pre('save', function(next) {
  if (this.capacity < 0) {
    throw new Error('Capacity cannot be negative');
  }
  next();
});

// Automatically update status based on eventDays
eventSchema.pre('save', async function(next) {
  if (!this.eventDays || this.eventDays.length === 0) {
    return next();
  }

  const now = new Date();
  const eventStart = this.startDate;
  const eventEnd = this.endDate;

  if (eventStart && eventEnd) {
    if (now < eventStart) {
      this.status = 'upcoming';
    } else if (now >= eventStart && now <= eventEnd) {
      this.status = 'ongoing';
    } else {
      this.status = 'completed';
    }
  }
  next();
});

// Add updateEventStatus method to schema
eventSchema.statics.updateEventStatus = async function() {
  const now = new Date();
  
  // Find events that just changed to ongoing
  const ongoingEvents = await this.find({
    eventDays: { $exists: true, $ne: [] },
    status: { $ne: 'ongoing' }
  });

  for (const event of ongoingEvents) {
    const eventStart = event.startDate;
    const eventEnd = event.endDate;
    
    if (eventStart && eventEnd && now >= eventStart && now <= eventEnd) {
      event.status = 'ongoing';
      await event.save();
    }
  }

  // Find events that just completed
  const justCompletedEvents = await this.find({
    eventDays: { $exists: true, $ne: [] },
    status: { $ne: 'completed' }
  });

  const completedEvents = [];
  for (const event of justCompletedEvents) {
    const eventEnd = event.endDate;
    
    if (eventEnd && now > eventEnd) {
      event.status = 'completed';
      await event.save();
      completedEvents.push(event);
    }
  }
  
  // If we found events that just completed, send feedback requests for them
  if (completedEvents.length > 0) {
    try {
      const feedbackController = require('../controllers/feedbackController');
      
      // Send feedback requests for each completed event
      for (const event of completedEvents) {
        try {
          console.log(`Automatically sending feedback requests for event: ${event.title} (${event._id})`);
          await feedbackController.sendFeedbackNotificationsAuto(event._id);
        } catch (error) {
          console.error(`Error sending auto feedback for event ${event._id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error loading feedback controller for auto notifications:', error);
    }
  }

  // Update upcoming events
  const upcomingEvents = await this.find({
    eventDays: { $exists: true, $ne: [] },
    status: { $ne: 'upcoming' }
  });

  for (const event of upcomingEvents) {
    const eventStart = event.startDate;
    
    if (eventStart && now < eventStart) {
      event.status = 'upcoming';
      await event.save();
    }
  }
};

module.exports = mongoose.model('Event', eventSchema);
