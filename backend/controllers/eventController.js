const Event = require('../models/eventModel');
const ErrorResponse = require('../utils/errorResponse');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

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
      .populate('organizer')  // Lấy tất cả thông tin của organizer
      .populate('department')  // Lấy tất cả thông tin của department
      .populate('participants')  // Thêm populate cho participants
      .populate('collaborators')  // Thêm populate cho collaborators
      .populate('speakers')  // Thêm populate cho speakers
      .populate({
        path: 'comments.user',  // Populate user trong comments
        select: 'fullName avatar'
      });
    if (!event) {
      return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching event', 500));
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
