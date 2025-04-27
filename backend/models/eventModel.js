const mongoose = require('mongoose');

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
        enum: ['zoom', 'google-meet', 'microsoft-teams', 'other'],
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
    enum: ['academic', 'cultural', 'sports', 'workshop', 'seminar', 'other'],
    required: [true, 'Please select event category']
  },
  registrationDeadline: {
    type: Date
  },
  capacity: {
    type: Number,
    default: 0
  },
  isRegistrationRequired: {
    type: Boolean,
    default: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Event', eventSchema);
