const NotificationModel = require('../models/notificationModel');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/userModel'); // Import User model
const { notifyUser } = require('../app');

// @desc    Lấy tất cả thông báo của người dùng
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await NotificationModel.find({ recipient: req.user.id })
      .populate('sender', 'fullName avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching notifications', 500));
  }
};

// @desc    Lấy số lượng thông báo chưa đọc
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await NotificationModel.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.status(200).json({
      success: true,
      data: count
    });
  } catch (error) {
    next(new ErrorResponse('Error fetching unread count', 500));
  }
};

// @desc    Đánh dấu thông báo đã đọc
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user.id
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return next(new ErrorResponse('Notification not found', 404));
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(new ErrorResponse('Error marking notification as read', 500));
  }
};

// @desc    Đánh dấu tất cả thông báo đã đọc
exports.markAllAsRead = async (req, res, next) => {
  try {
    await NotificationModel.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(new ErrorResponse('Error marking all notifications as read', 500));
  }
};

// @desc    Xóa thông báo
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await NotificationModel.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return next(new ErrorResponse('Notification not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(new ErrorResponse('Error deleting notification', 500));
  }
};

// @desc    Tạo thông báo hàng loạt
exports.createMassNotification = async (req, res, next) => {
  try {
    const { recipients = ['all'], type, title, message, relatedModel, relatedId, link } = req.body;

    let finalRecipients = recipients;
    if (recipients.includes('all')) {
      const allUsers = await User.find({ role: { $ne: 'admin' } }).select('_id');
      finalRecipients = allUsers.map(user => user._id.toString());
    }

    const notifications = await NotificationModel.create(
      finalRecipients.map(recipient => ({
        recipient,
        sender: req.user._id,
        type,
        title,
        message,
        relatedModel,
        relatedId,
        link
      }))
    );

    // Populate sender info before emitting
    const populatedNotifications = await NotificationModel.populate(notifications, {
      path: 'sender',
      select: 'fullName avatar'
    });

    // Emit to each recipient
    populatedNotifications.forEach(notification => {
      const recipientSocket = global.userSockets.get(notification.recipient.toString());
      if (recipientSocket) {
        recipientSocket.emit('newNotification', notification);
        
        // Also update unread count
        getUnreadCount(notification.recipient).then(count => {
          recipientSocket.emit('unreadCount', { count });
        });
      }
    });

    res.status(201).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to get unread count
const getUnreadCount = async (userId) => {
  return await NotificationModel.countDocuments({
    recipient: userId,
    read: false
  });
};

exports.createNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // Emit socket event cho user
    notifyUser(userId, notification);
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};
