const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const PasswordSecurity = require('../utils/passwordSecurity');
const emailHelper = require('../utils/emailHelper');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Enhanced user registration with email verification
 * @route   POST /api/v1/account/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { 
    username, 
    email, 
    password, 
    fullName, 
    class: className, 
    gender, 
    phone, 
    department,
    role = 'student'
  } = req.body;

  // Validate required fields
  if (!username || !email || !password || !fullName || !gender || !phone) {
    return next(new ErrorResponse('Vui lòng điền đầy đủ thông tin bắt buộc', 400));
  }

  // Validate password strength
  const passwordValidation = PasswordSecurity.validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return next(new ErrorResponse(`Mật khẩu không đủ mạnh: ${passwordValidation.errors.join(', ')}`, 400));
  }

  // Validate email domain for students
  if (role === 'student' && !email.toLowerCase().includes('hutech.edu.vn')) {
    return next(new ErrorResponse('Sinh viên phải sử dụng email @hutech.edu.vn', 400));
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Tên đăng nhập';
      return next(new ErrorResponse(`${field} đã được sử dụng`, 400));
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullName,
      class: className,
      gender,
      phone,
      department,
      role,
      isEmailVerified: false,
      mustChangePassword: false,
      loginAttempts: 0,
      lastPasswordChange: new Date()
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await emailHelper.sendEmailVerification(user, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Tài khoản đã được tạo thành công! Vui lòng kiểm tra email để xác thực.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return next(new ErrorResponse(`${field} đã được sử dụng`, 400));
    }
    next(error);
  }
});

/**
 * @desc    Verify email address
 * @route   GET /api/v1/account/verify-email/:token
 * @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new ErrorResponse('Token xác thực là bắt buộc', 400));
  }

  const user = await User.findByEmailVerificationToken(token);

  if (!user) {
    return next(new ErrorResponse('Token không hợp lệ hoặc đã hết hạn', 400));
  }

  await user.verifyEmail();

  res.status(200).json({
    success: true,
    message: 'Email đã được xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.'
  });
});

/**
 * @desc    Resend email verification
 * @route   POST /api/v1/account/resend-verification
 * @access  Public
 */
exports.resendVerificationEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Email là bắt buộc', 400));
  }

  const user = await User.findOne({ 
    email: email.toLowerCase(),
    isEmailVerified: false 
  });

  if (!user) {
    return next(new ErrorResponse('Không tìm thấy tài khoản hoặc email đã được xác thực', 400));
  }

  // Generate new verification token
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  try {
    await emailHelper.sendEmailVerification(user, verificationToken);
    
    res.status(200).json({
      success: true,
      message: 'Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.'
    });

  } catch (error) {
    console.error('Error sending verification email:', error);
    return next(new ErrorResponse('Có lỗi khi gửi email. Vui lòng thử lại sau.', 500));
  }
});

/**
 * @desc    Forgot password with 2 options
 * @route   POST /api/v1/account/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email, method = 'link' } = req.body; // method: 'link' hoặc 'temp'

  if (!email) {
    return next(new ErrorResponse('Email là bắt buộc', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new ErrorResponse('Không tìm thấy người dùng với email này', 404));
  }

  try {
    if (method === 'temp') {
      // Option 2: Gửi mật khẩu tạm thời
      const tempPassword = PasswordSecurity.generateTempPassword();
      
      // Set temporary password và yêu cầu đổi
      user.password = tempPassword;
      user.mustChangePassword = true;
      await user.save();

      await emailHelper.sendTempPassword(user, tempPassword);

      res.status(200).json({
        success: true,
        message: 'Mật khẩu tạm thời đã được gửi đến email của bạn.'
      });

    } else {
      // Option 1: Gửi link reset password (default)
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      await emailHelper.sendPasswordReset(user, resetToken);

      res.status(200).json({
        success: true,
        message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn.'
      });
    }

  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Error in forgot password:', error);
    return next(new ErrorResponse('Có lỗi khi gửi email. Vui lòng thử lại sau.', 500));
  }
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/account/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new ErrorResponse('Mật khẩu mới là bắt buộc', 400));
  }

  // Validate password strength
  const passwordValidation = PasswordSecurity.validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    return next(new ErrorResponse(`Mật khẩu không đủ mạnh: ${passwordValidation.errors.join(', ')}`, 400));
  }

  const user = await User.findByResetPasswordToken(token);

  if (!user) {
    return next(new ErrorResponse('Token không hợp lệ hoặc đã hết hạn', 400));
  }

  // Check password history
  const isPasswordReused = await user.checkPasswordHistory(password);
  if (isPasswordReused) {
    return next(new ErrorResponse('Không thể sử dụng lại mật khẩu đã dùng gần đây', 400));
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.mustChangePassword = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay bây giờ.'
  });
});

/**
 * @desc    Change password (authenticated user)
 * @route   PUT /api/v1/account/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới', 400));
  }

  const user = await User.findById(req.user.id).select('+password +passwordHistory');

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Mật khẩu hiện tại không đúng', 401));
  }

  // Validate new password strength
  const passwordValidation = PasswordSecurity.validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return next(new ErrorResponse(`Mật khẩu mới không đủ mạnh: ${passwordValidation.errors.join(', ')}`, 400));
  }

  // Check password history
  const isPasswordReused = await user.checkPasswordHistory(newPassword);
  if (isPasswordReused) {
    return next(new ErrorResponse('Không thể sử dụng lại mật khẩu đã dùng gần đây', 400));
  }

  // Set new password
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Mật khẩu đã được thay đổi thành công.'
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/account/profile  
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const allowedFields = ['fullName', 'phone', 'class', 'department', 'socialMedia'];
  const updates = {};

  // Only allow specific fields to be updated
  Object.keys(req.body).forEach(field => {
    if (allowedFields.includes(field)) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(new ErrorResponse('Không có thông tin nào để cập nhật', 400));
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true
  }).populate('department', 'name');

  res.status(200).json({
    success: true,
    message: 'Thông tin cá nhân đã được cập nhật thành công.',
    data: { user }
  });
});

/**
 * @desc    Check password strength
 * @route   POST /api/v1/account/check-password-strength
 * @access  Public
 */
exports.checkPasswordStrength = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new ErrorResponse('Mật khẩu là bắt buộc', 400));
  }

  const validation = PasswordSecurity.validatePasswordStrength(password);

  res.status(200).json({
    success: true,
    data: validation
  });
});

/**
 * @desc    Unlock user account (Admin only)
 * @route   PUT /api/v1/account/unlock/:userId
 * @access  Private (Admin)
 */
exports.unlockAccount = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new ErrorResponse('User ID là bắt buộc', 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('Không tìm thấy người dùng', 404));
  }

  if (!user.isLocked) {
    return next(new ErrorResponse('Tài khoản không bị khóa', 400));
  }

  try {
    await user.resetLoginAttempts();

    res.status(200).json({
      success: true,
      message: `Tài khoản của ${user.fullName} đã được mở khóa thành công.`
    });

  } catch (error) {
    console.error('Unlock account error:', error);
    return next(new ErrorResponse('Có lỗi khi mở khóa tài khoản', 500));
  }
});

/**
 * @desc    Force password change (Admin only)
 * @route   PUT /api/v1/account/force-password-change/:userId
 * @access  Private (Admin)
 */
exports.forcePasswordChange = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next(new ErrorResponse('User ID là bắt buộc', 400));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorResponse('Không tìm thấy người dùng', 404));
  }

  user.mustChangePassword = true;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `${user.fullName} sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần tới.`
  });
});

// Alias cho backward compatibility
exports.resendVerification = exports.resendVerificationEmail; 