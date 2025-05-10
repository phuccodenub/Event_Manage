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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
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
  collaborators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
  needsVolunteers: {
    type: Boolean,
    default: false
  },
  maxVolunteers: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

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

// Automatically update status based on dates
eventSchema.pre('save', async function(next) {
  const now = new Date();
  const eventStart = new Date(this.startDate);
  const eventEnd = new Date(this.endDate);

  if (now < eventStart) {
    this.status = 'upcoming';
  } else if (now >= eventStart && now <= eventEnd) {
    this.status = 'ongoing';
  } else {
    this.status = 'completed';
  }
  next();
});

// Add updateEventStatus method to schema
eventSchema.statics.updateEventStatus = async function() {
  const now = new Date();
  
  await this.updateMany(
    {
      startDate: { $lte: now },
      endDate: { $gt: now },
      status: { $ne: 'ongoing' }
    },
    { $set: { status: 'ongoing' } }
  );

  await this.updateMany(
    {
      endDate: { $lte: now },
      status: { $ne: 'completed' }
    },
    { $set: { status: 'completed' } }
  );

  await this.updateMany(
    {
      startDate: { $gt: now },
      status: { $ne: 'upcoming' }
    },
    { $set: { status: 'upcoming' } }
  );
};

module.exports = mongoose.model('Event', eventSchema);
