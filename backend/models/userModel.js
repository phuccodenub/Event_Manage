const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');

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
    required: true,
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

module.exports = mongoose.model('User', userSchema);
