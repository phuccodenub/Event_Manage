const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');

// Import the Event model to ensure it is registered
require('./eventModel');

// Import the Department model to ensure it is registered
require('./departmentModel');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    maxLength: [30, 'Tên đăng nhập không được vượt quá 30 ký tự'],
    minLength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minLength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false // Không trả mật khẩu khi truy vấn
  },
  avatar: {
    public_id: {
      type: String,
      default: null
    },
    url: {
      type: String,
      default: null
    }
  },
  userId: {
    type: String,
    unique: true,
    sparse: true
  },
  fullName: {
    type: String,
    required: true,
  },
  class: {
    type: String,
    required: function() {
      return this.role === 'student'; // Only required for students
    },
    validate: {
      validator: function(value) {
        if (this.role === 'student' && !value) {
          return false;
        }
        return true;
      },
      message: 'Lớp là bắt buộc đối với sinh viên'
    }
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  gender: {
    type: String,
    enum: ['nam', 'nữ', 'khác'],
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'speaker', 'admin'],
    default: 'student',
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  phone: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    validate: {
      validator: function(v) {
        return /^\d{10,11}$/.test(v);
      },
      message: 'Số điện thoại không hợp lệ'
    }
  },
  birthday: {
    type: Date,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Ngày sinh không hợp lệ'
    }
  },
  socialMedia: {
    facebook: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(https?:\/\/)?(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9(\.\?)?]/i.test(v);
        },
        message: 'Link Facebook không hợp lệ'
      }
    },
    linkedin: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i.test(v);
        },
        message: 'Link LinkedIn không hợp lệ'
      }
    },
    github: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/i.test(v);
        },
        message: 'Link GitHub không hợp lệ'
      }
    },
    instagram: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/i.test(v);
        },
        message: 'Link Instagram không hợp lệ'
      }
    }
  },
  registeredEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  collaboratorEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
    },
  ],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  oauthProvider: {
    type: String,
    enum: ['local', 'google', 'facebook'],
    default: 'local'
  },
  oauthId: {
    type: String,
    sparse: true
  },
}, { timestamps: true });

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  this.password = await bcrypt.hash(this.password, 10);
});

// Phương thức JWT token
userSchema.methods.getJWTToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// So sánh mật khẩu
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Tạo và lưu token đặt lại mật khẩu
userSchema.methods.getResetPasswordToken = function() {
  // Tạo token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Mã hóa token và lưu vào schema
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Đặt thời gian hết hạn token
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 phút

  return resetToken;
};

// Thêm phương thức static để cập nhật sự kiện đã đăng ký
userSchema.statics.updateRegisteredEvents = async function(userId, eventId, action) {
  try {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    if (action === 'join') {
      user.registeredEvents.addToSet(eventId);
    } else if (action === 'leave') {
      user.registeredEvents = user.registeredEvents.filter(
        id => id.toString() !== eventId.toString()
      );
    }

    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
};

// Đếm số lượng sự kiện không trùng lặp mà người dùng đã tham gia
userSchema.statics.countUniqueEvents = function(registeredEvents, collaboratorEvents) {
  // Chuyển đổi thành mảng chuỗi để dễ so sánh
  const registered = registeredEvents.map(id => id.toString());
  const collaborator = collaboratorEvents.map(id => id.toString());
  
  // Sử dụng Set để lấy danh sách không trùng lặp
  const uniqueEventIds = new Set([...registered, ...collaborator]);
  
  return uniqueEventIds.size;
};

// Phương thức instance để đếm số lượng sự kiện không trùng lặp
userSchema.methods.getUniqueEventCount = function() {
  return this.constructor.countUniqueEvents(this.registeredEvents, this.collaboratorEvents);
};

module.exports = mongoose.model('User', userSchema);
