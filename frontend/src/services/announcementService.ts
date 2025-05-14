import apiClient from '../api/apiClient';
import { AxiosResponse } from 'axios';
import { Announcement } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

const announcementService = {
  getAllAnnouncements: async (): Promise<Announcement[]> => {
    const response: AxiosResponse<ApiResponse<Announcement[]>> = 
      await apiClient.get('/announcements');
    return response.data.data;
  },

  createAnnouncement: async (data: Partial<Announcement>): Promise<Announcement> => {
    try {
      console.log('Creating announcement with data:', data);
      const response: AxiosResponse<ApiResponse<Announcement>> = 
        await apiClient.post('/announcements', data);
      return response.data.data;
    } catch (error) {
      console.error('Announcement creation error:', error);
      throw error;
    }
  },

  updateAnnouncement: async (id: string, formData: FormData): Promise<Announcement> => {
    const response: AxiosResponse<ApiResponse<Announcement>> = 
      await apiClient.put(`/announcements/${id}`, formData);
    return response.data.data;
  },

  deleteAnnouncement: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      await apiClient.delete(`/announcements/${id}`);
      return {
        success: true,
        message: 'Đã xóa thông báo thành công'
      };
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw {
        success: false,
        message: 'Lỗi khi xóa thông báo'
      };
    }
  },

  getAnnouncementById: async (id: string): Promise<Announcement> => {
    const response: AxiosResponse<ApiResponse<Announcement>> = 
      await apiClient.get(`/announcements/${id}`);
    return response.data.data;
  }
};

export default announcementService;
