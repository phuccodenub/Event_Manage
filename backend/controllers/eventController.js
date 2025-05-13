const Event = require('../models/eventModel');
const ErrorResponse = require('../utils/errorResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const NotificationService = require('../utils/notificationService');
const Registration = require('../models/registrationModel'); // Import Registration model
const mongoose = require('mongoose'); // Import mongoose for transactions
const User = require('../models/userModel'); // Import User model
const RegistrationForm = require('../models/registrationFormModel'); // Import RegistrationForm model

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

    // Handle registration form if needed
    eventData.needsRegistrationForm = req.body.needsRegistrationForm === 'true';
    eventData.needsVolunteers = req.body.needsVolunteers === 'true';
    eventData.maxVolunteers = parseInt(req.body.maxVolunteers) || 0;

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

    // Create event first
    const event = await Event.create(eventData);

    // If registration form is needed, create it
    if (eventData.needsRegistrationForm) {
      try {
        const formFields = req.body.formFields ? JSON.parse(req.body.formFields) : [];
        const registrationForm = await RegistrationForm.create({
          event: event._id,
          fields: formFields.length > 0 ? formFields : [
            // Default fields if none provided
            {
              fieldId: 'fullName',
              label: 'Họ và tên',
              type: 'text',
              required: true,
              placeholder: 'Nhập họ và tên'
            },
            {
              fieldId: 'studentId',
              label: 'MSSV',
              type: 'text',
              required: true,
              placeholder: 'Nhập mã số sinh viên'
            },
            {
              fieldId: 'email',
              label: 'Email',
              type: 'email',
              required: true,
              placeholder: 'Nhập email'
            }
          ],
          createdBy: req.user.id
        });

        // Update event with form reference
        event.registrationForm = registrationForm._id;
        await event.save();
      } catch (formError) {
        console.error('Error creating registration form:', formError);
      }
    }

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
    const eventData = { ...req.body };
    const oldEvent = await Event.findById(req.params.id);

    // Handle arrays properly
    const arrayFields = ['participants', 'collaborators', 'speakers', 'tags', 'likes', 'comments', 'shares'];
    arrayFields.forEach(field => {
      if (field in eventData) {
        try {
          // Parse if string, otherwise use as is
          eventData[field] = typeof eventData[field] === 'string' 
            ? JSON.parse(eventData[field])
            : eventData[field];
            
          // Ensure empty arrays are handled properly
          if (!Array.isArray(eventData[field])) {
            eventData[field] = [];
          }
        } catch (e) {
          eventData[field] = [];
        }
      }
    });

    // Handle location object
    if (eventData.location && typeof eventData.location === 'string') {
      eventData.location = JSON.parse(eventData.location);
    }

    // Handle images - Delete removed images from Cloudinary
    if ('existingImages' in eventData) {
      const newExistingImages = JSON.parse(eventData.existingImages || '[]');
      const oldImages = oldEvent.images || [];
      
      // Find images that were removed
      const removedImages = oldImages.filter(oldImg => 
        !newExistingImages.some(newImg => newImg.public_id === oldImg.public_id)
      );

      // Delete removed images from Cloudinary
      for (const image of removedImages) {
        try {
          await deleteFromCloudinary(image.public_id);
          console.log('Deleted image:', image.public_id);
        } catch (err) {
          console.error('Error deleting image from Cloudinary:', err);
        }
      }

      // Update images array - even if empty
      eventData.images = newExistingImages;
    }

    // Add new uploaded images if any
    if (req.body['images[0][public_id]']) {
      const newImages = [];
      let index = 0;
      while (req.body[`images[${index}][public_id]`]) {
        newImages.push({
          public_id: req.body[`images[${index}][public_id]`],
          url: req.body[`images[${index}][url]`]
        });
        index++;
      }
      
      // Combine with existing images
      eventData.images = eventData.images || [];
      eventData.images = [...eventData.images, ...newImages];
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      eventData,
      { new: true, runValidators: true }
    );

    if (!event) {
      return next(new ErrorHandler('Event not found', 404));
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc: Delete event with authorization check
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }

    // Check if user is event creator or admin
    if (event.creator?.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('Không có quyền xóa sự kiện này', 403));
    }

    // Start a transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Remove references from all users who registered for this event
      if (event.participants && event.participants.length > 0) {
        await User.updateMany(
          { _id: { $in: event.participants } },
          { $pull: { registeredEvents: event._id } },
          { session }
        );
      }

      // Remove references from all collaborators
      if (event.collaborators && event.collaborators.length > 0) {
        await User.updateMany(
          { _id: { $in: event.collaborators } },
          { $pull: { collaboratorEvents: event._id } },
          { session }
        );
      }

      // Delete the event
      await Event.findByIdAndDelete(event._id, { session });
      
      // Commit the transaction
      await session.commitTransaction();
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      // If anything fails, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      session.endSession();
    }
  } catch (error) {
    console.error('Delete event error:', error);
    next(new ErrorResponse('Lỗi khi xóa sự kiện', 500));
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Thêm form responses vào registration record
      const registrationData = {
        event: event._id,
        user: req.user._id,
        status: 'approved',
        formData: new Map() // Tạo Map mới để lưu form data
      };

      // Nếu có form responses thì lưu vào formData
      if (req.body.formResponses) {
        Object.entries(req.body.formResponses).forEach(([key, value]) => {
          // Xử lý đặc biệt cho checkbox - lưu array vào Map
          if (Array.isArray(value)) {
            registrationData.formData.set(key, value);
          } else {
            registrationData.formData.set(key, value);
          }
        });
      }

      // Tạo registration record với form data
      await Registration.create([registrationData], { session });

      // Thêm user vào participants
      event.participants.addToSet(req.user._id);
      await event.save({ session });

      // Cập nhật registeredEvents của user
      await User.updateRegisteredEvents(req.user._id, event._id, 'join');

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
      
      // Gửi thông báo sau khi đã commit transaction thành công
      try {
        const participant = await User.findById(req.user._id);
        await NotificationService.createEventLeaveNotification(event, participant);
        console.log('Leave event notification sent');
      } catch (notificationError) {
        console.error('Error sending leave notification:', notificationError);
        // Không throw lỗi ở đây để không ảnh hưởng đến response
      }
      
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

// @desc: Update event registration form
exports.updateEventForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fields } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return next(new ErrorResponse('Event not found', 404));
    }

    let form;
    if (event.registrationForm) {
      // Update existing form
      form = await RegistrationForm.findByIdAndUpdate(
        event.registrationForm,
        { fields },
        { new: true }
      );
    } else {
      // Create new form
      form = await RegistrationForm.create({
        event: event._id,
        fields,
        createdBy: req.user.id
      });
      event.registrationForm = form._id;
      await event.save();
    }

    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    next(error);
  }
};

// @desc: Get event registration form
exports.getEventRegistrationForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registrationForm') // Add this populate
      .select('registrationForm needsRegistrationForm');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Return the populated registration form if it exists
    if (event.needsRegistrationForm && event.registrationForm) {
      return res.status(200).json({
        success: true,
        data: {
          fields: event.registrationForm.fields || []
        }
      });
    }

    // Return empty fields if no form exists
    return res.status(200).json({
      success: true,
      data: { fields: [] }
    });

  } catch (error) {
    console.error('Error getting registration form:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getFormSubmissions = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Kiểm tra quyền (chỉ organizer và admin mới xem được)
    if (event.organizer.toString() !== req.user._id.toString() 
        && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view submissions'
      });
    }

    const submissions = await Registration.find({ event: event._id })
      .populate('user')
      .select('formData createdAt status') // Make sure formData is included
      .sort({ createdAt: -1 });

    // Format data to include form responses
    const formattedSubmissions = submissions.map(sub => ({
      _id: sub._id,
      user: sub.user,
      status: sub.status,
      createdAt: sub.createdAt,
      formResponses: sub.formData || {} // Include the form responses
    }));

    res.status(200).json({
      success: true,
      data: formattedSubmissions
    });
  } catch (error) {
    console.error('Error getting form submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting submissions'
    });
  }
};
