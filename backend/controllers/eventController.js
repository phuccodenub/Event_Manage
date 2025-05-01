const Event = require('../models/eventModel');
const ErrorResponse = require('../utils/errorResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const NotificationService = require('../utils/notificationService');
const Registration = require('../models/registrationModel'); // Import Registration model
const mongoose = require('mongoose'); // Import mongoose for transactions
const User = require('../models/userModel'); // Import User model

// @desc: Get all events
// @route: GET /api/v1/events
// @access: Public
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('organizer')  // Lấy tất cả thông tin của organizer
      .populate('department')  // Lấy tất cả thông tin của department
      .populate('participants')  // Thêm populate cho participants
      .populate('collaborators')  // Thêm populate cho collaborators
      .populate('speakers');  // Thêm populate cho speakers
    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching events', 500));
  }
};

// @desc: Get single event by ID
// @route: GET /api/v1/events/:id
// @access: Public
exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer')
      .populate('department')
      .populate('participants')  // Make sure to populate participants
      .lean();  // Convert to plain object

    if (!event) {
      return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
    }

    // Ensure participants array contains string IDs
    event.participants = event.participants.map(p => p._id.toString());

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc: Create event with image upload
exports.createEvent = async (req, res, next) => {
  try {
    const eventData = { ...req.body };
    eventData.creator = req.user.id;

    // Parse location JSON if it's a string
    if (typeof eventData.location === 'string') {
      eventData.location = JSON.parse(eventData.location);
    }

    // Handle images array from form data
    const images = [];
    // Check if we have image data in the request
    if (req.body['images[0][public_id]']) {
      let index = 0;
      while (req.body[`images[${index}][public_id]`]) {
        images.push({
          public_id: req.body[`images[${index}][public_id]`],
          url: req.body[`images[${index}][url]`]
        });
        index++;
      }
      eventData.images = images;
    }

    const event = await Event.create(eventData);
    await event.populate('creator');
    
    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Event creation error:', error);
    next(new ErrorResponse(error.message, 500));
  }
};

// @desc: Update event with authorization check
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);
    
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    // Kiểm tra quyền chỉnh sửa
    if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to update this event', 403));
    }

    const eventData = { ...req.body };
    
    // Xử lý upload ảnh mới nếu có
    if (req.files) {
      // Xóa ảnh cũ từ Cloudinary
      const deletePromises = event.images.map(img => 
        deleteFromCloudinary(img.public_id)
      );
      await Promise.all(deletePromises);

      // Upload ảnh mới
      const imagePromises = Object.values(req.files).map(file => 
        uploadToCloudinary(file)
      );
      const uploadedImages = await Promise.all(imagePromises);
      eventData.images = uploadedImages;
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      eventData,
      { new: true, runValidators: true }
    ).populate('creator', 'fullName email');

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
};

// @desc: Delete event with authorization check
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    // Check authorization
    if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Not authorized to delete this event', 403));
    }

    // Delete images from Cloudinary
    if (event.images?.length > 0) {
      const deletePromises = event.images.map(img => 
        deleteFromCloudinary(img.public_id)
      );
      await Promise.all(deletePromises);
    }

    // Use findByIdAndDelete instead of remove
    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse(error.message, 500));
  }
};

// @desc: Join event
exports.joinEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    // Kiểm tra xem sự kiện đã kết thúc chưa
    if (new Date(event.endDate) < new Date()) {
      return next(new ErrorResponse('Event has already ended', 400));
    }

    // Kiểm tra xem user đã tham gia chưa
    if (event.participants.includes(req.user._id)) {
      return next(new ErrorResponse('Already joined this event', 400));
    }

    // Thực hiện các thao tác cập nhật trong một transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Thêm user vào danh sách participants của event
      event.participants.addToSet(req.user._id);
      await event.save({ session });

      // 2. Cập nhật registeredEvents của user
      await User.updateRegisteredEvents(req.user._id, event._id, 'join');

      // 3. Tạo registration record
      await Registration.create([{
        event: event._id,
        user: req.user._id,
        status: 'approved'
      }], { session });

      // 4. Gửi thông báo
      await NotificationService.createEventJoinNotification(event, req.user);

      await session.commitTransaction();
      
      res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    next(error);
  }
};

// @desc: Leave event
exports.leaveEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Xóa user khỏi participants của event
      await Event.findByIdAndUpdate(
        event._id,
        { $pull: { participants: req.user._id } },
        { session }
      );

      // 2. Xóa event khỏi registeredEvents của user
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { registeredEvents: event._id } },
        { session }
      );

      // 3. Xóa hoàn toàn registration record
      await Registration.findOneAndDelete(
        { 
          event: event._id, 
          user: req.user._id 
        },
        { session }
      );

      // Debug log
      console.log('Leaving event:', {
        eventId: event._id,
        userId: req.user._id,
        action: 'complete removal'
      });

      await session.commitTransaction();
      
      res.status(200).json({
        success: true,
        message: 'Successfully left event and removed all related records'
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in leaveEvent:', error);
    next(error);
  }
};

// @desc: Get event participants
exports.getEventParticipants = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    // Debug log để kiểm tra các giá trị
    console.log('Debug getEventParticipants:', {
      userId: req.user.id,
      creatorId: event.creator.toString(),
      organizerId: event.organizer.toString(),
      userRole: req.user.role
    });

    // Sửa lại cách so sánh ID
    const canViewParticipants = 
      event.creator.toString() === req.user.id || 
      event.organizer.toString() === req.user.id || 
      req.user.role === 'admin';

    // Debug log kết quả kiểm tra quyền
    console.log('Can view participants:', canViewParticipants);

    if (!canViewParticipants) {
      return next(new ErrorResponse('Not authorized to view participants', 403));
    }

    // Lấy thông tin chi tiết người tham gia và registration status
    const participants = await Registration.find({ 
      event: event._id,
      status: { $ne: 'cancelled' } // Chỉ lấy những người chưa hủy đăng ký
    })
      .populate('user', 'fullName email avatar')
      .select('user status registeredAt')
      .sort({ registeredAt: -1 }); // Sắp xếp theo thời gian đăng ký, mới nhất lên đầu

    const formattedParticipants = participants.map(reg => ({
      _id: reg.user._id,
      fullName: reg.user.fullName,
      email: reg.user.email,
      avatar: reg.user.avatar,
      registrationStatus: reg.status,
      registeredAt: reg.registeredAt
    }));

    res.status(200).json({
      success: true,
      data: formattedParticipants
    });
  } catch (error) {
    console.error('Error in getEventParticipants:', error);
    next(error);
  }
};
