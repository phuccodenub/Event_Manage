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
      enum: ['text', 'email', 'tel', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date'],
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    placeholder: String,
    options: [String], // For select, radio, checkbox
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      message: String
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for better performance
collaboratorFormSchema.index({ event: 1 });

module.exports = mongoose.model('CollaboratorForm', collaboratorFormSchema); 