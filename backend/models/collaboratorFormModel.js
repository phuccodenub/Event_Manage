const mongoose = require('mongoose');

const collaboratorFormSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  fields: [{
    fieldId: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'email', 'number', 'tel', 'date', 'select', 'checkbox', 'radio', 'textarea']
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: String,
    options: [String], // For select, checkbox, radio
    defaultValue: mongoose.Schema.Types.Mixed
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
collaboratorFormSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better performance
collaboratorFormSchema.index({ event: 1 });

module.exports = mongoose.model('CollaboratorForm', collaboratorFormSchema); 