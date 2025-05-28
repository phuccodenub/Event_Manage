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
      event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
      },
      schedule: {
        start: {
          type: Date,
          required: true
        },
        end: {
          type: Date,
          required: true
        }
      }
    }
  ],
  joinedCommunities: [
    {
      community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
      },
      role: {
        type: String,
        enum: ['member', 'admin', 'moderator'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active'
      },
      lastActive: {
        type: Date,
        default: Date.now
      },
      notifications: {
        enabled: {
          type: Boolean,
          default: true
        },
        settings: {
          newEvents: {
            type: Boolean,
            default: true
          },
          announcements: {
            type: Boolean,
            default: true
          },
          discussions: {
            type: Boolean,
            default: true
          }
        }
      }
    }
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
  showProfileToOthers: {
    type: Boolean,
    default: true,
    description: 'Cho phép người dùng khác xem thông tin cơ bản của người dùng'
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
userSchema.statics.updateRegisteredEvents = async function(userId, eventId, action, schedule = null) {
  try {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    if (action === 'join') {
      user.registeredEvents.addToSet(eventId);
    } else if (action === 'leave') {
      user.registeredEvents = user.registeredEvents.filter(
        id => id.toString() !== eventId.toString()
      );
    } else if (action === 'collaborate' && schedule) {
      // Kiểm tra xung đột lịch
      const hasScheduleConflict = user.collaboratorEvents.some(collab => {
        return (
          (schedule.start >= collab.schedule.start && schedule.start < collab.schedule.end) ||
          (schedule.end > collab.schedule.start && schedule.end <= collab.schedule.end)
        );
      });

      if (hasScheduleConflict) {
        throw new Error('Lịch làm việc bị trùng với sự kiện khác');
      }

      // Thêm vào danh sách sự kiện làm cộng tác viên
      user.collaboratorEvents.push({
        event: eventId,
        schedule: schedule
      });
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

// Phương thức thêm community
userSchema.methods.joinCommunity = async function(communityId, role = 'member') {
  const existingJoin = this.joinedCommunities.find(
    join => join.community.toString() === communityId.toString()
  );

  if (existingJoin) {
    if (existingJoin.status === 'banned') {
      throw new Error('Bạn đã bị cấm tham gia cộng đồng này');
    }
    if (existingJoin.status === 'active') {
      throw new Error('Bạn đã là thành viên của cộng đồng này');
    }
    // Nếu đã tham gia nhưng inactive, cập nhật lại status
    existingJoin.status = 'active';
    existingJoin.lastActive = new Date();
    await this.save();
    return existingJoin;
  }

  this.joinedCommunities.push({
    community: communityId,
    role,
    joinedAt: new Date(),
    lastActive: new Date()
  });

  await this.save();
  return this.joinedCommunities[this.joinedCommunities.length - 1];
};

// Phương thức rời community
userSchema.methods.leaveCommunity = async function(communityId) {
  const joinIndex = this.joinedCommunities.findIndex(
    join => join.community.toString() === communityId.toString()
  );

  if (joinIndex === -1) {
    throw new Error('Bạn chưa tham gia cộng đồng này');
  }

  // Thay vì xóa, chúng ta sẽ đánh dấu là inactive
  this.joinedCommunities[joinIndex].status = 'inactive';
  this.joinedCommunities[joinIndex].lastActive = new Date();
  
  await this.save();
  return this.joinedCommunities[joinIndex];
};

// Phương thức cập nhật thông tin tham gia community
userSchema.methods.updateCommunityJoin = async function(communityId, updates) {
  const joinIndex = this.joinedCommunities.findIndex(
    join => join.community.toString() === communityId.toString()
  );

  if (joinIndex === -1) {
    throw new Error('Bạn chưa tham gia cộng đồng này');
  }

  // Cập nhật các trường được phép
  const allowedUpdates = ['role', 'notifications', 'status'];
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      this.joinedCommunities[joinIndex][key] = updates[key];
    }
  });

  this.joinedCommunities[joinIndex].lastActive = new Date();
  await this.save();
  return this.joinedCommunities[joinIndex];
};

// Phương thức lấy danh sách communities đang tham gia
userSchema.methods.getActiveCommunities = function() {
  return this.joinedCommunities.filter(join => join.status === 'active');
};

// Phương thức kiểm tra xem user có phải là admin của community không
userSchema.methods.isCommunityAdmin = function(communityId) {
  const join = this.joinedCommunities.find(
    join => join.community.toString() === communityId.toString() && join.status === 'active'
  );
  return join && join.role === 'admin';
};

// Phương thức kiểm tra xem user có phải là moderator của community không
userSchema.methods.isCommunityModerator = function(communityId) {
  const join = this.joinedCommunities.find(
    join => join.community.toString() === communityId.toString() && join.status === 'active'
  );
  return join && (join.role === 'moderator' || join.role === 'admin');
};

module.exports = mongoose.model('User', userSchema);
