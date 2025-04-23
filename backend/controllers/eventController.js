const Event = require('../models/eventModel');
const ErrorResponse = require('../utils/errorResponse');

// @desc: Get all events
// @route: GET /api/v1/events
// @access: Public
exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'fullName email')
      .populate('department', 'name');
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
      .populate('organizer', 'fullName email')
      .populate('department', 'name');
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

// @desc: Create a new event
// @route: POST /api/v1/events
// @access: Private/Admin or Teacher
exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(new ErrorResponse('Error creating event', 500));
  }
};

// @desc: Update event by ID
// @route: PUT /api/v1/events/:id
// @access: Private/Admin or Teacher
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(new ErrorResponse('Error updating event', 500));
  }
};

// @desc: Delete event by ID
// @route: DELETE /api/v1/events/:id
// @access: Private/Admin
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return next(new ErrorResponse(`Event not found with id of ${req.params.id}`, 404));
    }
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(new ErrorResponse('Error deleting event', 500));
  }
};
