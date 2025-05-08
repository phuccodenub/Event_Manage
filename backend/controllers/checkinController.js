const Checkin = require('../models/checkinModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Registration = require('../models/registrationModel');
const ErrorResponse = require('../utils/errorResponse');

exports.checkinUser = async (req, res, next) => {
  try {
    const { eventId, studentId } = req.body;
    const checkinMethod = req.body.method || 'manual';

    // Kiểm tra event và quyền checkin
    const event = await Event.findById(eventId).populate('department');
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    const canCheckin = req.user.role === 'admin' || 
                      (req.user.department === event.department._id.toString() && 
                       ['moderator', 'admin'].includes(req.user.role));
                       
    if (!canCheckin) {
      return next(new ErrorResponse('Not authorized to perform checkin', 403));
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
    const { eventId } = req.params;

    const checkins = await Checkin.find({ event: eventId })
      .populate('user', 'fullName userId email avatar')
      .populate('checkedBy', 'fullName')
      .sort('-checkinTime');

    res.status(200).json({
      success: true,
      data: checkins
    });

  } catch (error) {
    next(error);
  }
};
