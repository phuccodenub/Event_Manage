import apiClient from '../api/apiClient';
import { AxiosResponse } from 'axios';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  images: Array<{
    public_id: string;
    url: string;
  }>;
  creator: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  department: {
    _id: string;
    name: string;
  };
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'expired' | 'archived';
}

interface AnnouncementData {
  title: string;
  content: string; // Đảm bảo có trường content
  category: string;
  priority?: number;
  department?: string;
  expiresAt?: string;
  images?: Array<{
    public_id: string;
    url: string;
  }>;
}

const announcementService = {
  getAllAnnouncements: async (): Promise<Announcement[]> => {
    const response: AxiosResponse<{ success: boolean; data: Announcement[] }> = 
      await apiClient.get('/announcements');
    return response.data.data;
  },

  createAnnouncement: async (data: AnnouncementData): Promise<Announcement> => {
    try {
      console.log('Creating announcement with data:', data);
      const response: AxiosResponse<{ success: boolean; data: Announcement }> = 
        await apiClient.post('/announcements', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Announcement creation error:', error.response?.data || error);
      throw error;
    }
  },

  updateAnnouncement: async (id: string, formData: FormData): Promise<Announcement> => {
    const response: AxiosResponse<{ success: boolean; data: Announcement }> = 
      await apiClient.put(`/announcements/${id}`, formData);
    return response.data.data;
  },

  deleteAnnouncement: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete(`/announcements/${id}`);
      return {
        success: true,
        message: 'Đã xóa thông báo thành công'
      };
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      throw {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi xóa thông báo'
      };
    }
  },

  getAnnouncementById: async (id: string): Promise<Announcement> => {
    const response: AxiosResponse<{ success: boolean; data: Announcement }> = 
      await apiClient.get(`/announcements/${id}`);
    return response.data.data;
  }
};

export default announcementService;
