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

const announcementService = {
  getAllAnnouncements: async (): Promise<Announcement[]> => {
    const response: AxiosResponse<{ success: boolean; data: Announcement[] }> = 
      await apiClient.get('/announcements');
    return response.data.data;
  },

  createAnnouncement: async (formData: FormData): Promise<Announcement> => {
    const response: AxiosResponse<{ success: boolean; data: Announcement }> = 
      await apiClient.post('/announcements', formData);
    return response.data.data;
  },

  updateAnnouncement: async (id: string, formData: FormData): Promise<Announcement> => {
    const response: AxiosResponse<{ success: boolean; data: Announcement }> = 
      await apiClient.put(`/announcements/${id}`, formData);
    return response.data.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}`);
  }
};

export default announcementService;
