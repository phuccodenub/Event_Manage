import apiClient from '../api/apiClient';

interface MassNotificationData {
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
    const response = await apiClient.get('/notifications/unread');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
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
