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

    // Theo dõi người dùng đã nhận thông báo
    const notifiedUsers = new Set();

    // Emit to each recipient
    populatedNotifications.forEach(notification => {
      try {
        const recipientId = notification.recipient.toString();
        
        // Check if global.userSockets exists and is a Map
        if (global.userSockets && global.userSockets instanceof Map) {
          const recipientSocket = global.userSockets.get(recipientId);
          
          if (recipientSocket) {
            console.log(`Gửi thông báo "${type}" đến người dùng ${recipientId}`);
            recipientSocket.emit('newNotification', notification);
            
            // Đánh dấu người dùng đã nhận thông báo
            notifiedUsers.add(recipientId);
            
            // Also update unread count
            getUnreadCount(recipientId).then(count => {
              recipientSocket.emit('unreadCount', { count });
            });
          } else {
            console.log(`Người dùng ${recipientId} không trực tuyến để nhận thông báo "${type}"`);
          }
        } else {
          console.log('Socket system not initialized, skipping real-time notification');
        }
      } catch (error) {
        console.error(`Lỗi khi gửi thông báo đến người dùng ${notification.recipient}:`, error);
      }
    });

    // Broadcast thông báo sự kiện mới CHỈ cho những người dùng chưa nhận được thông báo
    if (type === 'new_event') {
      console.log('Phát thông báo về sự kiện mới đến những người dùng kết nối chưa nhận thông báo');
      const firstNotification = populatedNotifications[0];
      
      if (firstNotification && global.userSockets && global.userSockets instanceof Map) {
        // Thay vì dùng global.io.emit (gửi cho tất cả)
        // Duyệt qua tất cả socket và gửi cho những người chưa nhận
        for (const [userId, socket] of global.userSockets.entries()) {
          // Bỏ qua người tạo thông báo và những người đã nhận thông báo
          if (userId !== req.user._id.toString() && !notifiedUsers.has(userId)) {
            console.log(`Broadcast thông báo sự kiện mới đến người dùng ${userId}`);
            socket.emit('newNotification', firstNotification);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hàng loạt:', error);
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
