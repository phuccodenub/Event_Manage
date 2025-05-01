import apiClient from '../api/apiClient';
import { DashboardStats, AdminEvent, AdminUser, AdminAnnouncement, DateRange } from '../types/admin';

const adminService = {
  getDashboardStats: async (timeRange: DateRange): Promise<DashboardStats> => {
    const { start, end } = timeRange;
    const response = await apiClient.get('/admin/dashboard/stats', {
      params: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
    return response.data;
  },

  getDetailedStats: async (type: 'users' | 'events' | 'announcements', timeRange: DateRange) => {
    const { start, end } = timeRange;
    const response = await apiClient.get(`/admin/${type}/stats`, {
      params: {
        start: start.toISOString(),
        end: end.toISOString(),
        detailed: true
      }
    });
    return response.data;
  },

  getActivities: async (timeRange: DateRange) => {
    const { start, end } = timeRange;
    const response = await apiClient.get('/admin/activities', {
      params: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });
    return response.data;
  },

  generateReport: async (type: string, timeRange: DateRange, format: 'pdf' | 'excel') => {
    const { start, end } = timeRange;
    const response = await apiClient.get(`/admin/reports/${type}`, {
      params: {
        start: start.toISOString(),
        end: end.toISOString(),
        format
      },
      responseType: 'blob'
    });
    return response.data;
  },

  getAdminEvents: async (): Promise<AdminEvent[]> => {
    const response = await apiClient.get('/admin/events');
    return response.data;
  },

  getAdminUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  getAdminAnnouncements: async (): Promise<AdminAnnouncement[]> => {
    const response = await apiClient.get('/admin/announcements');
    return response.data;
  },

  updateUserStatus: async (userId: string, status: string): Promise<AdminUser> => {
    const response = await apiClient.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  updateEventStatus: async (eventId: string, status: string): Promise<AdminEvent> => {
    const response = await apiClient.put(`/admin/events/${eventId}/status`, { status });
    return response.data;
  }
};

export default adminService;
