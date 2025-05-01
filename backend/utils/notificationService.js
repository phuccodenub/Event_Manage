const User = require('../models/userModel');
const NotificationModel = require('../models/notificationModel');

class NotificationService {
  static async createNotification(data) {
    try {
      const notification = await NotificationModel.create(data);
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async createMassNotification(recipients, data) {
    try {
      const filteredRecipients = recipients.filter(
        recipientId => recipientId.toString() !== data.sender.toString()
      );

      const notifications = filteredRecipients.map(recipient => ({
        recipient,
        ...data
      }));
      
      const created = await NotificationModel.insertMany(notifications);
      return created;
    } catch (error) {
      console.error('Error creating mass notifications:', error);
      throw error;
    }
  }

  static async createEventJoinNotification(event, participant) {
    try {
      console.log('Creating event join notification:', {
        event: event._id,
        participant: participant._id
      });

      // Thông báo cho người tổ chức
      await NotificationModel.create({
        recipient: event.creator,
        sender: participant._id,
        type: 'event_joined',
        title: 'New Event Participant',
        message: `${participant.fullName} đã đăng ký tham gia sự kiện "${event.title}"`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}/participants`
      });

      // Thông báo cho người tham gia
      await NotificationModel.create({
        recipient: participant._id,
        sender: event.creator,
        type: 'event_confirmation',
        title: 'Event Registration Confirmed',
        message: `Bạn đã đăng ký tham gia sự kiện "${event.title}" thành công`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}`
      });

    } catch (error) {
      console.error('Error in createEventJoinNotification:', error);
      throw error;
    }
  }

  static async createEventLeaveNotification(event, participant) {
    try {
      await this.createNotification({
        recipient: event.creator,
        sender: participant._id,
        type: 'event_left',
        title: 'Event Participant Left',
        message: `${participant.fullName} đã hủy đăng ký tham gia sự kiện "${event.title}"`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}/participants`,
        icon: 'user-minus',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating event leave notification:', error);
      throw error;
    }
  }

  static async createEventReminderNotification(event) {
    try {
      // Gửi nhắc nhở cho tất cả người tham gia
      await this.createMassNotification(event.participants, {
        sender: event.creator,
        type: 'event_reminder',
        title: 'Event Reminder',
        message: `Sự kiện "${event.title}" sẽ diễn ra trong 24 giờ tới`,
        relatedModel: 'Event',
        relatedId: event._id,
        link: `/events/${event._id}`,
        icon: 'clock',
        priority: 'high'
      });
    } catch (error) {
      console.error('Error creating event reminder notification:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;