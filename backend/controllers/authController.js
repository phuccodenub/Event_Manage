const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Import the Event model to ensure it is registered
require('../models/eventModel');

// Import the Department model to ensure it is registered
require('../models/departmentModel');

// Hàm gửi token
const sendTokenResponse = (user, statusCode, res) => {
  // Tạo token
  const token = user.getJWTToken();

  // Tùy chọn cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Thêm secure flag trong production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options) // Chỉ lưu token vào cookie
    .json({
      success: true,
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
      }, // Trả về thông tin người dùng
    });
};

// @desc    Đăng ký người dùng
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, userId, class: className, gender, phone, birthday } = req.body;

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      userId,
      class: className,
      gender,
      phone,
      birthday
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
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

    const user = await User.findOne({ username })
      .select('+password')
      .populate('registeredEvents', 'name date location') // Populate event details
      .populate('collaboratorEvents', 'name date location') // Populate event details
      .populate('department', 'name'); // Populate department details

    if (!user) {
      return next(new ErrorResponse('Tài khoản hoặc mật khẩu không đúng', 401));
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Tài khoản hoặc mật khẩu không đúng', 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
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

