const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');

// @desc: Get all users
// @route: GET /api/v1/users
// @access: Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching users', 500));
  }
};

// @desc: Get single user by ID
// @route: GET /api/v1/users/:id
// @access: Public
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching user', 500));
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
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: user
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
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse('Error deleting user', 500));
  }
};

