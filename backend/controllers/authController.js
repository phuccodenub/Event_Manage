const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { OAuth2Client } = require('google-auth-library');
const asyncHandler = require('express-async-handler');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Import the Event model to ensure it is registered
require('../models/eventModel');

// Import the Department model to ensure it is registered
require('../models/departmentModel');

// Hàm gửi token
const sendTokenResponse = (user, statusCode, res) => {
  // Tạo token
  const token = user.getJWTToken();

  // Tùy chọn cookie với enhanced security
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token, // Return token for localStorage
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        role: user.role,
        class: user.class,
        gender: user.gender,
        phone: user.phone,
        department: user.department,
        registeredEvents: user.registeredEvents,
        collaboratorEvents: user.collaboratorEvents,
        isEmailVerified: user.isEmailVerified || true,
        mustChangePassword: user.mustChangePassword || false,
        lastLogin: user.lastLogin
      },
    });
};

// @desc    Đăng ký người dùng
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    console.log('Registration data received:', req.body);
    
    const { 
      fullName, 
      username, 
      email, 
      password, 
      phoneNumber, 
      studentId, 
      department, 
      role = 'student' 
    } = req.body;

    // Validation
    if (!fullName || !username || !email || !password) {
      return next(new ErrorResponse('Vui lòng nhập đầy đủ thông tin bắt buộc', 400));
    }

    // Check if username already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.username === username.toLowerCase()) {
        return next(new ErrorResponse('Tên đăng nhập đã tồn tại', 400));
      }
      if (existingUser.email === email.toLowerCase()) {
        return next(new ErrorResponse('Email đã được sử dụng', 400));
      }
    }

    const userData = {
      fullName,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
      phone: phoneNumber || '0000000000',
      gender: 'khác', // Default value
      class: 'Unknown' // Default value for students
    };

    // Add optional fields if provided
    if (studentId) {
      userData.userId = studentId;
    }
    if (department) {
      userData.department = department;
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    const user = await User.create(userData);

    console.log('User created successfully:', user._id);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new ErrorResponse(messages.join(', '), 400));
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new ErrorResponse(`${field} đã tồn tại`, 400));
    }
    
    next(error);
  }
};

// @desc    Đăng nhập
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(new ErrorResponse('Vui lòng nhập tên tài khoản và mật khẩu', 400));
    }

    // Tìm user theo username hoặc email
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    })
      .select('+password +loginAttempts +lockUntil +mustChangePassword')
      .populate('registeredEvents', 'title startDate')
      .populate('collaboratorEvents.event', 'title startDate')
      .populate('department', 'name');

    if (!user) {
      return next(new ErrorResponse('Tên đăng nhập hoặc mật khẩu không đúng', 401));
    }

    // Kiểm tra account có bị khóa không
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return next(new ErrorResponse(`Tài khoản đang bị khóa. Thử lại sau ${lockTimeRemaining} phút.`, 423));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      // Tăng số lần đăng nhập sai
      await user.incLoginAttempts();
      return next(new ErrorResponse('Tên đăng nhập hoặc mật khẩu không đúng', 401));
    }

    // Reset login attempts khi đăng nhập thành công
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Cập nhật last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Kiểm tra có cần đổi password không
    if (user.mustChangePassword) {
      return res.status(200).json({
        success: true,
        mustChangePassword: true,
        message: 'Bạn cần thay đổi mật khẩu trước khi tiếp tục',
        tempToken: user.getJWTToken(),
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email
        }
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Đăng nhập Google
// @route   POST /api/v1/auth/google-login
// @access  Public
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return next(new ErrorResponse('No credential provided', 400));
    }

    console.log('Verifying Google token...');
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    console.log('Google payload:', payload);

    if (!payload) {
      return next(new ErrorResponse('Invalid Google token', 401));
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({
      $or: [
        { oauthId: googleId, oauthProvider: 'google' },
        { email: email }
      ]
    });

    if (!user) {
      console.log('Creating new user from Google data...');
      const defaultClass = 'Unknown'; // Default class for student role
      user = await User.create({
        username: `google_${googleId.slice(-8)}`,
        email,
        fullName: name,
        password: Math.random().toString(36).slice(-8),
        oauthProvider: 'google',
        oauthId: googleId,
        gender: 'khác',
        phone: '0000000000',
        role: 'student', // Explicitly set role
        class: defaultClass, // Set default class for student
        avatar: {
          url: picture
        }
      });
    } else {
      console.log('Existing user found:', user.email);
      // Update existing user's Google-related info
      user.oauthProvider = 'google';
      user.oauthId = googleId;
      if (picture && !user.avatar?.url) {
        user.avatar = { url: picture };
      }
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Google auth error:', error);
    next(new ErrorResponse(error.message || 'Google authentication failed', 401));
  }
};

// @desc    Đăng nhập Facebook
// @route   POST /api/v1/auth/facebook-login
// @access  Public
exports.facebookLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return next(new ErrorResponse('No access token provided', 400));
    }

    // Fetch user data from Facebook Graph API
    const response = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) {
      console.error('Facebook API Error:', data.error);
      return next(new ErrorResponse('Invalid Facebook token', 401));
    }

    console.log('Facebook user data:', data);

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { oauthId: data.id, oauthProvider: 'facebook' },
        { email: data.email }
      ]
    });

    if (!user) {
      // Create new user
      user = await User.create({
        username: `fb_${data.id.slice(-8)}`,
        email: data.email || `fb_${data.id}@facebook.com`,
        fullName: data.name,
        password: Math.random().toString(36).slice(-8), // Random password
        oauthProvider: 'facebook',
        oauthId: data.id,
        gender: 'khác',
        role: 'student',
        class: 'Unknown',
        phone: '0000000000',
        avatar: {
          url: data.picture?.data?.url
        }
      });
    } else {
      // Update existing user's Facebook info
      user.oauthProvider = 'facebook';
      user.oauthId = data.id;
      if (data.picture?.data?.url && !user.avatar?.url) {
        user.avatar = { url: data.picture.data.url };
      }
      await user.save();
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Facebook login error:', error);
    next(new ErrorResponse('Facebook authentication failed', 401));
  }
};

// @desc    Đăng xuất
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Lấy thông tin người dùng hiện tại
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user
  });
};

// ========== SECURITY UTILITIES ==========

/**
 * @desc    Check if email is available
 * @route   POST /api/v1/auth/check-email
 * @access  Public
 */
exports.checkEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Email là bắt buộc', 400));
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  res.status(200).json({
    success: true,
    available: !existingUser,
    message: existingUser ? 'Email đã được sử dụng' : 'Email có thể sử dụng'
  });
});

/**
 * @desc    Check if username is available
 * @route   POST /api/v1/auth/check-username
 * @access  Public
 */
exports.checkUsername = asyncHandler(async (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return next(new ErrorResponse('Username là bắt buộc', 400));
  }

  const existingUser = await User.findOne({ username: username.toLowerCase() });

  res.status(200).json({
    success: true,
    available: !existingUser,
    message: existingUser ? 'Tên đăng nhập đã được sử dụng' : 'Tên đăng nhập có thể sử dụng'
  });
});

