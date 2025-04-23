const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');

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
    const { username, email, password, fullName, userId, class: className, gender, phone } = req.body;

    const user = await User.create({
      username,
      email,
      password,
      fullName,
      userId,
      class: className,
      gender,
      phone
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

