const Feedback = require('../models/feedbackModel');
const Event = require('../models/eventModel');
const Checkin = require('../models/checkinModel');
const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const NotificationService = require('../utils/notificationService');

/**
 * @desc    Create new feedback for an event
 * @route   POST /api/v1/events/:eventId/feedback
 * @access  Private
 */
exports.createFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }

    // Verify the event has ended
    const currentDate = new Date();
    if (new Date(event.endDate) > currentDate) {
      return next(new ErrorResponse('Chỉ có thể gửi đánh giá sau khi sự kiện kết thúc', 400));
    }

    // Verify user was checked in as a participant
    const checkin = await Checkin.findOne({
      event: eventId,
      user: userId,
      type: 'participant'
    });

    if (!checkin) {
      return next(new ErrorResponse('Bạn phải điểm danh tham gia sự kiện mới có thể gửi đánh giá', 403));
    }

    // Check if user already submitted feedback
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: userId
    });

    if (existingFeedback) {
      return next(new ErrorResponse('Bạn đã gửi đánh giá cho sự kiện này', 400));
    }

    // Create feedback
    const feedback = await Feedback.create({
      event: eventId,
      user: userId,
      rating: req.body.rating,
      content: req.body.content,
      tags: req.body.tags
    });

    // Notify event organizer about the new feedback
    if (event.organizer) {
      await NotificationService.createNotification({
        recipient: event.organizer,
        sender: req.user._id,
        type: 'event_feedback_received',
        title: 'Đã nhận đánh giá mới',
        message: `Sự kiện "${event.title}" đã nhận được đánh giá mới từ người tham gia`,
        relatedModel: 'Event',
        relatedId: eventId,
        link: `/events/${eventId}/feedback`
      });
    }

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feedback for an event
 * @route   GET /api/v1/events/:eventId/feedback
 * @access  Public
 */
exports.getEventFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }

    // Get feedback
    const feedback = await Feedback.find({ event: eventId })
      .populate('user', 'fullName avatar email userId')
      .sort('-createdAt');

    // Calculate average rating
    const ratings = feedback.map(f => f.rating);
    const averageRating = ratings.length > 0 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
      : 0;

    // Count feedback by rating
    const ratingCounts = {
      total: feedback.length,
      '5': ratings.filter(r => r === 5).length,
      '4': ratings.filter(r => r === 4).length,
      '3': ratings.filter(r => r === 3).length,
      '2': ratings.filter(r => r === 2).length,
      '1': ratings.filter(r => r === 1).length
    };

    // Count feedback by tag
    const tagCounts = {};
    feedback.forEach(f => {
      if (f.tags && f.tags.length > 0) {
        f.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        feedback,
        stats: {
          averageRating,
          ratingCounts,
          tagCounts
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if user can submit feedback
 * @route   GET /api/v1/events/:eventId/feedback/check
 * @access  Private
 */
exports.checkFeedbackEligibility = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }

    // Check if the event has ended
    const currentDate = new Date();
    const hasEnded = new Date(event.endDate) < currentDate;

    if (!hasEnded) {
      return res.status(200).json({
        success: true,
        data: {
          canSubmitFeedback: false,
          hasSubmitted: false,
          reason: 'EVENT_NOT_ENDED'
        }
      });
    }

    // Check if user was checked in as a participant
    const checkin = await Checkin.findOne({
      event: eventId,
      user: userId,
      type: 'participant'
    });

    if (!checkin) {
      return res.status(200).json({
        success: true,
        data: {
          canSubmitFeedback: false,
          hasSubmitted: false,
          reason: 'NOT_CHECKED_IN'
        }
      });
    }

    // Check if user already submitted feedback
    const existingFeedback = await Feedback.findOne({
      event: eventId,
      user: userId
    });

    const hasSubmitted = !!existingFeedback;

    res.status(200).json({
      success: true,
      data: {
        canSubmitFeedback: !hasSubmitted,
        hasSubmitted,
        reason: hasSubmitted ? 'ALREADY_SUBMITTED' : null,
        eventData: {
          title: event.title,
          coverImage: event.coverImage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all completed events the user has checked in to but not yet provided feedback
 * @route   GET /api/v1/events/pending-feedback
 * @access  Private
 */
exports.getPendingFeedbackEvents = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all checked-in events for this user
    const checkins = await Checkin.find({
      user: userId,
      type: 'participant'
    }).distinct('event');
    
    if (checkins.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Find completed events from these checkin records
    const completedEvents = await Event.find({
      _id: { $in: checkins },
      endDate: { $lt: new Date() },
      status: 'completed'
    }).select('title coverImage location startDate endDate');

    if (completedEvents.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Find events where user has already submitted feedback
    const existingFeedback = await Feedback.find({
      user: userId,
      event: { $in: completedEvents.map(e => e._id) }
    }).distinct('event');
    
    // Convert ObjectIds to strings for proper comparison
    const feedbackEventIds = existingFeedback.map(id => id.toString());

    // Filter out events with existing feedback
    const pendingFeedbackEvents = completedEvents.filter(
      event => !feedbackEventIds.includes(event._id.toString())
    );

    res.status(200).json({
      success: true,
      data: pendingFeedbackEvents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send feedback notifications to eligible users
 * @route   POST /api/v1/events/:eventId/feedback/notify
 * @access  Private (Admin only)
 */
exports.sendFeedbackNotifications = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return next(new ErrorResponse('Không tìm thấy sự kiện', 404));
    }

    // Admin/organizer check
    const isAdmin = req.user.role === 'admin';
    const isOrganizer = event.organizer && event.organizer.toString() === req.user._id.toString();
    const isCreator = event.creator && event.creator.toString() === req.user._id.toString();

    if (!isAdmin && !isOrganizer && !isCreator) {
      return next(new ErrorResponse('Không có quyền truy cập', 403));
    }

    // Check if the event has ended
    const currentDate = new Date();
    if (new Date(event.endDate) > currentDate) {
      return next(new ErrorResponse('Chỉ có thể gửi yêu cầu đánh giá sau khi sự kiện kết thúc', 400));
    }

    // Find all checked-in participants
    const checkins = await Checkin.find({
      event: eventId,
      type: 'participant'
    });

    // Extract unique user IDs
    const userIds = [...new Set(checkins
      .filter(c => c.user) // Filter out null/undefined users
      .map(c => c.user.toString()))];

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Không có người tham gia nào điểm danh để gửi thông báo',
        count: 0
      });
    }

    // Find users who haven't submitted feedback yet
    const existingFeedback = await Feedback.find({
      event: eventId,
      user: { $in: userIds }
    });

    const feedbackUserIds = existingFeedback.map(f => f.user.toString());
    const eligibleUserIds = userIds.filter(id => !feedbackUserIds.includes(id));

    if (eligibleUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Tất cả người tham gia đã gửi đánh giá',
        count: 0
      });
    }

    // Send notifications to eligible users
    await NotificationService.createMassNotification(eligibleUserIds, {
      sender: req.user._id,
      type: 'event_feedback_request',
      title: 'Đánh giá sự kiện',
      message: `Vui lòng đánh giá sự kiện "${event.title}" mà bạn đã tham gia`,
      relatedModel: 'Event',
      relatedId: eventId,
      link: `/events/${eventId}?feedback=true`,
      data: {
        requiresFeedback: true
      }
    });

    res.status(200).json({
      success: true,
      message: `Đã gửi thông báo yêu cầu đánh giá đến ${eligibleUserIds.length} người tham gia`,
      count: eligibleUserIds.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send feedback notifications to eligible users (automatic version for system calls)
 * @access  Private (System only)
 */
exports.sendFeedbackNotificationsAuto = async (eventId) => {
  try {
    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      console.error(`Auto feedback notification failed: Event ${eventId} not found`);
      return;
    }

    // Find all checked-in participants
    const checkins = await Checkin.find({
      event: eventId,
      type: 'participant'
    });

    // Extract unique user IDs
    const userIds = [...new Set(checkins
      .filter(c => c.user) // Filter out null/undefined users
      .map(c => c.user.toString()))];

    if (userIds.length === 0) {
      console.log(`No checked-in participants found for event ${eventId}`);
      return;
    }

    // Find users who haven't submitted feedback yet
    const existingFeedback = await Feedback.find({
      event: eventId,
      user: { $in: userIds }
    });

    const feedbackUserIds = existingFeedback.map(f => f.user.toString());
    const eligibleUserIds = userIds.filter(id => !feedbackUserIds.includes(id));

    if (eligibleUserIds.length === 0) {
      console.log(`No eligible participants for feedback in event ${eventId}`);
      return;
    }

    // Send notifications to eligible users
    await NotificationService.createMassNotification(eligibleUserIds, {
      sender: event.creator || event.organizer,
      type: 'event_feedback_request',
      title: 'Đánh giá sự kiện',
      message: `Vui lòng đánh giá sự kiện "${event.title}" mà bạn đã tham gia`,
      relatedModel: 'Event',
      relatedId: eventId,
      link: `/events/${eventId}?feedback=true`,
      data: {
        requiresFeedback: true
      }
    });

    console.log(`Auto-sent feedback request to ${eligibleUserIds.length} participants for event ${eventId}`);
  } catch (error) {
    console.error(`Error in sendFeedbackNotificationsAuto for event ${eventId}:`, error);
  }
}; 