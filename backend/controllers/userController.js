const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const Event = require('../models/eventModel');

// @desc: Get all users (with optional role filtering)
// @route: GET /api/v1/users
// @access: Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const query = User.find();

    // Nếu có filter role
    if (req.query.roles) {
      const roles = req.query.roles.split(',');
      query.where('role').in(roles);
    }

    // Select các trường cần thiết
    query.select('-password -__v');

    const users = await query.exec();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc: Get single user by ID
// @route: GET /api/v1/users/:id
// @access: Public
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('department')
      .populate('registeredEvents')
      .populate('collaboratorEvents');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Tính số lượng sự kiện không trùng lặp
    const uniqueEventCount = user.getUniqueEventCount();

    // Chuyển đổi thành plain object để có thể thêm field
    const userObj = user.toObject();
    userObj.uniqueEventCount = uniqueEventCount;

    res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching user', 500));
  }
};

// @desc: Get user's events
// @route: GET /api/v1/users/:id/events
// @access: Private
exports.getUserEvents = async (req, res, next) => {
  try {
    // Kiểm tra xem người dùng tồn tại không
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse('Không tìm thấy người dùng', 404));
    }
    
    // Lấy danh sách sự kiện mà người dùng đã tham gia (bao gồm cả tham gia và làm CTV)
    const registeredEventIds = user.registeredEvents || [];
    const collaboratorEventIds = user.collaboratorEvents || [];
    
    // Kết hợp cả hai danh sách và loại bỏ trùng lặp
    const allEventIds = [...new Set([...registeredEventIds, ...collaboratorEventIds])];
    
    console.log(`User ${user._id} (${user.fullName}) has ${registeredEventIds.length} registered events and ${collaboratorEventIds.length} collaborator events. Total unique events: ${allEventIds.length}`);
    
    // Lấy chi tiết của tất cả sự kiện
    const events = await Event.find({ _id: { $in: allEventIds } })
      .populate('department', 'name')
      .populate('organizer', 'fullName')
      .sort({ startDate: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    next(new ErrorResponse('Lỗi khi lấy danh sách sự kiện', 500));
  }
};

// @desc: Create a new user
// @route: POST /api/v1/users
// @access: Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(new ErrorResponse('Error creating user', 500));
  }
};

// @desc: Update user by ID
// @route: PUT /api/v1/users/:id
// @access: Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Handle avatar upload if exists
    if (req.files?.avatar) {
      // Delete old avatar if exists
      if (user.avatar?.public_id) {
        await deleteFromCloudinary(user.avatar.public_id);
      }

      const result = await uploadToCloudinary(
        req.files.avatar.tempFilePath,
        'avatars'
      );

      req.body.avatar = {
        public_id: result.public_id,
        url: result.url
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(new ErrorResponse('Error updating user', 500));
  }
};

// @desc: Delete user by ID
// @route: DELETE /api/v1/users/:id
// @access: Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatar?.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse('Error deleting user', 500));
  }
};

// @desc: Update user avatar
// @route: PUT /api/v1/users/me/avatar
// @access: Private
exports.updateAvatar = async (req, res, next) => {
  try {
    if (!req.files || !req.files.avatar) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // Upload new avatar to Cloudinary
    const result = await uploadToCloudinary(req.files.avatar);

    // Update user avatar in database
    user.avatar = {
      public_id: result.public_id,
      url: result.url
    };
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Avatar update error:', error);
    return next(new ErrorResponse('Error updating avatar', 500));
  }
};

// @desc: Delete user avatar
// @route: DELETE /api/v1/users/me/avatar
// @access: Private
exports.deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.avatar?.public_id) {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    user.avatar = null;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(new ErrorResponse('Error deleting avatar', 500));
  }
};

// @desc: Reset user password
// @route: POST /api/v1/users/:id/reset-password
// @access: Private/Admin
exports.resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    // Set new password and save
    user.password = 'password123';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(new ErrorResponse('Error resetting password', 500));
  }
};

// @desc: Change user password
// @route: PUT /api/v1/users/me/password
// @access: Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Please provide current and new password', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // Check if current password matches
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }
    
    // Set new password and save
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    next(new ErrorResponse('Error changing password', 500));
  }
};

