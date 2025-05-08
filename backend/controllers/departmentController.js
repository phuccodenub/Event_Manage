const Department = require('../models/departmentModel');
const User = require('../models/userModel');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorResponse = require('../utils/errorResponse');

exports.getAllDepartments = catchAsyncErrors(async (req, res, next) => {
  const departments = await Department.find()
    .populate({
      path: 'head',
      select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
    })
    .populate({
      path: 'administrators',
      select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
    })
    .populate({
      path: 'moderators',
      select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
    });

  res.status(200).json({
    success: true,
    data: departments
  });
});

exports.getDepartmentById = catchAsyncErrors(async (req, res, next) => {
  const department = await Department.findById(req.params.id)
    .populate('head')
    .populate('eventManagers');

  if (!department) {
    return next(new ErrorHandler('Department not found', 404));
  }

  res.status(200).json({
    success: true,
    data: department
  });
});

exports.createDepartment = catchAsyncErrors(async (req, res, next) => {
  const department = await Department.create(req.body);
  res.status(201).json({
    success: true,
    data: department
  });
});

exports.updateDepartment = catchAsyncErrors(async (req, res, next) => {
  let department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorHandler('Department not found', 404));
  }

  department = await Department.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: department
  });
});

exports.deleteDepartment = catchAsyncErrors(async (req, res, next) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return next(new ErrorHandler('Department not found', 404));
  }

  await department.remove();

  res.status(200).json({
    success: true,
    message: 'Department deleted successfully'
  });
});

// Assign department head
exports.assignDepartmentHead = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.body;
  const departmentId = req.params.id;

  if (!userId) {
    return next(new ErrorHandler('User ID is required', 400));
  }

  // Check if user exists and is a teacher
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  if (user.role !== 'teacher') {
    return next(new ErrorHandler('Only teachers can be assigned as department head', 400));
  }

  const department = await Department.findByIdAndUpdate(
    departmentId,
    { head: userId },
    { 
      new: true,
      runValidators: true 
    }
  ).populate('head');

  if (!department) {
    return next(new ErrorHandler('Department not found', 404));
  }

  res.status(200).json({
    success: true,
    data: department
  });
});

// Get department head
exports.getDepartmentHead = catchAsyncErrors(async (req, res, next) => {
  const department = await Department.findById(req.params.id)
    .populate('head');

  if (!department) {
    return next(new ErrorHandler('Department not found', 404));
  }

  res.status(200).json({
    success: true,
    data: department.head
  });
});

exports.updateDepartmentRoles = async (req, res, next) => {
  try {
    const { role, userId, action } = req.body;
    const department = await Department.findById(req.params.id);

    if (!department) {
      return next(new ErrorResponse('Department not found', 404));
    }

    if (action === 'add') {
      department[role].addToSet(userId);
    } else if (action === 'remove') {
      department[role].pull(userId);
    } else {
      return next(new ErrorResponse('Invalid action', 400));
    }

    await department.save();

    // Populate đầy đủ thông tin user
    await department.populate([
      {
        path: 'head',
        select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
      },
      {
        path: 'administrators',
        select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
      },
      {
        path: 'moderators',
        select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
      }
    ]);

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentMembers = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate({
        path: 'head',
        select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
      })
      .populate({
        path: 'administrators',
        select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
      })
      .populate({
        path: 'moderators',
        select: 'fullName email avatar role userId department collaboratorEvents registeredEvents phone gender birthday class'
      });

    if (!department) {
      return next(new ErrorResponse('Department not found', 404));
    }

    const members = {
      head: department.head,
      administrators: department.administrators,
      moderators: department.moderators
    };

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    next(error);
  }
};
