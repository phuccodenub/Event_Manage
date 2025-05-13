import apiClient from '../api/apiClient';

// Sửa lỗi "defined but never used" bằng cách export interface
export interface MassNotificationData {
  type: 'event' | 'announcement' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  link?: string;
  sender?: string;
  excludeSender?: boolean;
}

const notificationService = {
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return {
        notifications: response.data.data || [],
        unreadCount: response.data.unreadCount || 0
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await apiClient.get('/notifications/unread');
      
      // API trả về { success: true, data: number }
      if (response.data && typeof response.data.data === 'number') {
        return {
          success: response.data.success,
          data: response.data.data,
          unreadCount: response.data.data // Thêm trường unreadCount cho tương thích ngược
        };
      }
      
      return { success: false, data: 0, unreadCount: 0 };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { success: false, data: 0, unreadCount: 0 };
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await apiClient.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  createMassNotification: async (data: {
    recipients: string[];  // Make recipients required
    type: string;
    title: string;
    message: string;
    relatedModel?: string;
    relatedId?: string;
    link?: string;
  }) => {
    try {
      console.log('Creating notification with data:', data);
      const response = await apiClient.post('/notifications/mass', {
        ...data,
        recipients: data.recipients || ['all']  // Ensure recipients always has a value
      });
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },
};

export default notificationService;
