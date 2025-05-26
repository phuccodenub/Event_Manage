const User = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');

class NotificationService {
  static async createNotification(data) {
    try {
      const notification = await NotificationModel.create(data);
      
      // Gửi thông báo qua socket.io
      if (data.recipient) {
        const recipientSocket = global.userSockets.get(data.recipient.toString());
        if (recipientSocket) {
          recipientSocket.emit('newNotification', notification);
        }
      }
      
      return notification;
    } catch (error) {
      console.error('Lỗi khi tạo thông báo:', error);
      throw error;
    }
  }

  static async createMassNotification(recipients, data) {
    try {
      // Lọc danh sách người nhận, loại bỏ người gửi để tránh tự gửi thông báo cho chính mình
      const filteredRecipients = recipients.filter(
        recipientId => recipientId && recipientId.toString() !== data.sender.toString()
      );

      // Nếu không có người nhận hợp lệ, trả về mảng rỗng
      if (filteredRecipients.length === 0) {
        return [];
      }

      const notifications = filteredRecipients.map(recipient => ({
        recipient,
        ...data
      }));
      
      const created = await NotificationModel.insertMany(notifications);
      
      // Gửi thông báo qua socket.io cho từng người nhận
      for (const notification of created) {
        const recipientSocket = global.userSockets.get(notification.recipient.toString());
        if (recipientSocket) {
          try {
            // Populate sender information before emitting
            const populatedNotification = await NotificationModel.findById(notification._id)
              .populate('sender', 'fullName avatar');
              
            recipientSocket.emit('newNotification', populatedNotification);
          } catch (err) {
            console.error('Lỗi khi gửi thông báo hàng loạt:', err);
          }
        }
      }
      
      return created;
    } catch (error) {
      console.error('Lỗi khi tạo thông báo hàng loạt:', error);
      throw error;
    }
  }

  static async createEventJoinNotification(event, participant) {
    try {
      console.log('Đang tạo thông báo tham gia sự kiện:', {
        event: event._id,
        participant: participant._id
      });

      // Thông báo cho người tổ chức
      const organizerNotification = await NotificationModel.create({
        recipient: event.creator,
        sender: participant,
        type: 'event_joined',
        title: `${participant.fullName} đã đăng ký tham gia sự kiện.`,
        message: `${participant.fullName} đã đăng ký tham gia sự kiện "${event.title}"`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}/participants`
      });
      
      // Gửi thông báo qua socket cho người tổ chức
      const organizerSocket = global.userSockets.get(event.creator.toString());
      if (organizerSocket) {
        console.log('Đang gửi thông báo đến người tổ chức:', event.creator);
        
        // Populate sender information before emitting
        const populatedNotification = await NotificationModel.findById(organizerNotification._id)
          .populate('sender', 'fullName avatar');
          
        organizerSocket.emit('newNotification', populatedNotification);
        
        // Cập nhật số lượng thông báo chưa đọc
        const unreadCount = await NotificationModel.countDocuments({
          recipient: event.creator,
          read: false
        });
        organizerSocket.emit('unreadCount', { count: unreadCount });
      }

      // Không gửi thông báo cho người tham gia về việc họ tham gia sự kiện

    } catch (error) {
      console.error('Lỗi trong createEventJoinNotification:', error);
      throw error;
    }
  }

  static async createEventLeaveNotification(event, participant) {
    try {
      // Thông báo cho người tổ chức
      const organizerNotification = await NotificationModel.create({
        recipient: event.creator,
        sender: participant,
        type: 'event_left',
        title: `${participant.fullName} đã hủy tham gia sự kiện`,
        message: `${participant.fullName} đã hủy đăng ký tham gia sự kiện "${event.title}"`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}/participants`,
        icon: 'user-minus',
        priority: 'medium'
      });
      
      // Gửi thông báo qua socket cho người tổ chức
      const organizerSocket = global.userSockets.get(event.creator.toString());
      if (organizerSocket) {
        console.log('Đang gửi thông báo rời đi đến người tổ chức:', event.creator);
        
        // Populate sender information before emitting
        const populatedNotification = await NotificationModel.findById(organizerNotification._id)
          .populate('sender', 'fullName avatar');
        
        organizerSocket.emit('newNotification', populatedNotification);
        
        // Cập nhật số lượng thông báo chưa đọc
        const unreadCount = await NotificationModel.countDocuments({
          recipient: event.creator,
          read: false
        });
        organizerSocket.emit('unreadCount', { count: unreadCount });
      }
      
      // Không gửi thông báo cho người tham gia về việc họ đã rời khỏi sự kiện
    } catch (error) {
      console.error('Lỗi khi tạo thông báo rời khỏi sự kiện:', error);
      throw error;
    }
  }

  static async createCollaboratorJoinNotification(event, collaborator, isAutoApproved = false) {
    try {
      console.log('Đang tạo thông báo tham gia làm CTV:', {
        event: event._id,
        collaborator: collaborator._id,
        isAutoApproved
      });

      // Kiểm tra event và event.creator có tồn tại không
      if (!event || !event.creator) {
        console.error('Lỗi: event hoặc event.creator không tồn tại', { event });
        return; // Thoát khỏi hàm nếu không có thông tin cần thiết
      }

      // Thông báo cho người tổ chức
      const organizerNotification = await NotificationModel.create({
        recipient: event.creator,
        sender: collaborator,
        type: isAutoApproved ? 'event_collaborator_approved' : 'event_collaborator_request',
        title: isAutoApproved 
          ? `${collaborator.fullName} đã tham gia làm CTV`
          : `${collaborator.fullName} đã gửi yêu cầu làm CTV`,
        message: isAutoApproved
          ? `${collaborator.fullName} đã tham gia làm cộng tác viên cho sự kiện "${event.title}"`
          : `${collaborator.fullName} đã gửi yêu cầu làm cộng tác viên cho sự kiện "${event.title}"`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}/collaborators`,
        icon: 'user-plus',
        priority: 'medium'
      });
      
      // Gửi thông báo qua socket cho người tổ chức
      // Chuyển đổi event.creator thành string và kiểm tra global.userSockets trước khi gọi .get()
      const creatorId = event.creator.toString();
      if (global.userSockets && typeof global.userSockets.get === 'function') {
        const organizerSocket = global.userSockets.get(creatorId);
      if (organizerSocket) {
          console.log('Đang gửi thông báo CTV đến người tổ chức:', creatorId);
        
        // Populate sender information before emitting
        const populatedNotification = await NotificationModel.findById(organizerNotification._id)
          .populate('sender', 'fullName avatar');
          
        organizerSocket.emit('newNotification', populatedNotification);
        
        // Cập nhật số lượng thông báo chưa đọc
        const unreadCount = await NotificationModel.countDocuments({
          recipient: event.creator,
          read: false
        });
        organizerSocket.emit('unreadCount', { count: unreadCount });
        }
      } else {
        console.log('UserSockets không khả dụng hoặc không có phương thức get');
      }
    } catch (error) {
      console.error('Lỗi trong createCollaboratorJoinNotification:', error);
      throw error;
    }
  }

  static async createCollaboratorLeaveNotification(event, collaborator) {
    try {
      // Kiểm tra event và event.creator có tồn tại không
      if (!event || !event.creator) {
        console.error('Lỗi: event hoặc event.creator không tồn tại trong createCollaboratorLeaveNotification', { event });
        return; // Thoát khỏi hàm nếu không có thông tin cần thiết
      }

      // Thông báo cho người tổ chức
      const organizerNotification = await NotificationModel.create({
        recipient: event.creator,
        sender: collaborator,
        type: 'event_collaborator_leave',
        title: `${collaborator.fullName} đã hủy làm CTV sự kiện`,
        message: `${collaborator.fullName} đã hủy đăng ký làm cộng tác viên cho sự kiện "${event.title}"`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}/collaborators`,
        icon: 'user-minus',
        priority: 'medium'
      });
      
      // Gửi thông báo qua socket cho người tổ chức
      // Chuyển đổi event.creator thành string và kiểm tra global.userSockets trước khi gọi .get()
      const creatorId = event.creator.toString();
      if (global.userSockets && typeof global.userSockets.get === 'function') {
        const organizerSocket = global.userSockets.get(creatorId);
      if (organizerSocket) {
          console.log('Đang gửi thông báo hủy CTV đến người tổ chức:', creatorId);
        
        // Populate sender information before emitting
        const populatedNotification = await NotificationModel.findById(organizerNotification._id)
          .populate('sender', 'fullName avatar');
        
        organizerSocket.emit('newNotification', populatedNotification);
        
        // Cập nhật số lượng thông báo chưa đọc
        const unreadCount = await NotificationModel.countDocuments({
          recipient: event.creator,
          read: false
        });
        organizerSocket.emit('unreadCount', { count: unreadCount });
        }
      } else {
        console.log('UserSockets không khả dụng hoặc không có phương thức get trong createCollaboratorLeaveNotification');
      }
    } catch (error) {
      console.error('Lỗi khi tạo thông báo hủy CTV sự kiện:', error);
      throw error;
    }
  }

  static async createEventReminderNotification(event) {
    try {
      // Lọc danh sách người tham gia, loại bỏ người tạo sự kiện nếu họ cũng là người tham gia
      const filteredParticipants = event.participants.filter(
        participantId => participantId.toString() !== event.creator.toString()
      );
      
      // Gửi nhắc nhở cho tất cả người tham gia (trừ người tạo)
      const notifications = await this.createMassNotification(filteredParticipants, {
        sender: event.creator,
        type: 'event_reminder',
        title: 'Nhắc nhở sự kiện',
        message: `Sự kiện "${event.title}" sẽ diễn ra trong 24 giờ tới`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}`,
        icon: 'clock',
        priority: 'high'
      });
      
      // Gửi thông báo qua socket.io cho từng người tham gia
      for (const notification of notifications) {
        const recipientSocket = global.userSockets.get(notification.recipient.toString());
        if (recipientSocket) {
          try {
            // Populate sender information before emitting
            const populatedNotification = await NotificationModel.findById(notification._id)
              .populate('sender', 'fullName avatar');
              
            recipientSocket.emit('newNotification', populatedNotification);
            
            // Cập nhật số lượng thông báo chưa đọc
            const count = await NotificationModel.countDocuments({
              recipient: notification.recipient,
              read: false
            });
            
            recipientSocket.emit('unreadCount', { count });
          } catch (err) {
            console.error('Lỗi khi gửi thông báo nhắc nhở:', err);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi tạo thông báo nhắc nhở sự kiện:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;