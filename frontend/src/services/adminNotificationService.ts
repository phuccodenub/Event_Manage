import apiClient from '../api/apiClient';

const adminNotificationService = {
  getNotifications: async () => {
    try {
      const response = await apiClient.get('/notifications');
      return {
        notifications: response.data?.data || [], // Đảm bảo luôn trả về array
        unreadCount: response.data?.unreadCount || 0
      };
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      return {
        notifications: [],
        unreadCount: 0
      }; // Return empty state instead of throwing
    }
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  }
};

export default adminNotificationService;
