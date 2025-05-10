const mongoose = require('mongoose');

const formFieldSchema = new mongoose.Schema({
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
    enum: ['text', 'number', 'email', 'radio', 'checkbox', 'textarea', 'date'],
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    label: String,
    value: String
  }],
  placeholder: String,
  responses: {
    type: mongoose.Schema.Types.Mixed, // Cho phép lưu cả array và string
    get: function(data) {
      // Trả về array nếu là checkbox, string cho các trường khác
      return this.type === 'checkbox' ? 
        (Array.isArray(data) ? data : [data]).filter(Boolean) : 
        data;
    }
  }
});

const registrationFormSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true
  },
  fields: [formFieldSchema],
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RegistrationForm', registrationFormSchema);
