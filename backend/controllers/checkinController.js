const Checkin = require('../models/checkinModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Registration = require('../models/registrationModel');
const Department = require('../models/departmentModel');
const ErrorResponse = require('../utils/errorResponse');

const canAccessCheckin = async (user, event) => {
  // System admin has full access
  if (user.role === 'admin') return true;

  // Get department details if exists
  if (event.department) {
    const department = await Department.findById(event.department);
    if (!department) return false;

    return (
      // Department head
      user._id.toString() === department.head?.toString() ||
      // Department admin
      department.administrators.includes(user._id.toString()) ||
      // Department moderator
      department.moderators.includes(user._id.toString())
    );
  }

  return false;
};

exports.checkinUser = async (req, res, next) => {
  try {
    const { eventId, studentId } = req.body;
    const checkinMethod = req.body.method || 'manual';

    const event = await Event.findById(eventId).populate('department');
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'EVENT_NOT_FOUND' 
      });
    }

    // Check access permission
    const hasAccess = await canAccessCheckin(req.user, event);
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'PERMISSION_DENIED' 
      });
    }

    // Kiểm tra xem đã checkin chưa
    const existingCheckin = await Checkin.findOne({
      event: eventId,
      studentId: studentId
    });

    if (existingCheckin) {
      return next(new ErrorResponse('Student ID already checked in', 400));
    }

    // Tìm user nếu có
    const userToCheckin = await User.findOne({ userId: studentId });

    // Tạo checkin record, không phụ thuộc vào việc có user hay không
    const checkin = await Checkin.create({
      event: eventId,
      studentId,
      checkinMethod,
      checkedBy: req.user._id,
      user: userToCheckin ? userToCheckin._id : null, // User ID có thể null
      wasRegistered: false
    });

    // Nếu tìm thấy user, cập nhật thêm thông tin registration và participants
    if (userToCheckin) {
      // Kiểm tra và cập nhật registration
      const registration = await Registration.findOne({
        event: eventId,
        user: userToCheckin._id
      });

      if (!registration) {
        await Registration.create({
          event: eventId,
          user: userToCheckin._id,
          status: 'attended'
        });

        // Thêm vào danh sách participants
        await Event.findByIdAndUpdate(eventId, {
          $addToSet: { participants: userToCheckin._id }
        });
      } else {
        await Registration.findByIdAndUpdate(registration._id, {
          status: 'attended'
        });
      }

      // Populate thông tin user nếu có
      await checkin.populate('user', 'fullName userId email avatar');
    }

    await checkin.populate('checkedBy', 'fullName');

    res.status(200).json({
      success: true,
      data: checkin
    });

  } catch (error) {
    next(error);
  }
};

exports.getEventCheckins = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('department');

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'EVENT_NOT_FOUND' 
      });
    }

    // Check access permission
    const hasAccess = await canAccessCheckin(req.user, event);
    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        error: 'PERMISSION_DENIED' 
      });
    }

    const checkins = await Checkin.find({ event: req.params.eventId })
      .populate('user')
      .populate('checkedBy')
      .sort('-checkinTime');

    res.status(200).json({
      success: true,
      data: checkins
    });

  } catch (error) {
    next(error);
  }
};
