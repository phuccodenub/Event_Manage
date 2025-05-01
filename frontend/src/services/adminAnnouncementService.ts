import apiClient from '../api/apiClient';
import uploadService from './uploadService';
import { AxiosResponse } from 'axios';

interface AdminAnnouncement {
  _id: string;
  title: string;
  content: string;
  type: 'event' | 'news' | 'urgent';
  status: 'published' | 'draft' | 'active' | 'expired' | 'archived';
  priority: 'low' | 'medium' | 'high';
  creator: {
    _id: string;
    fullName: string;
    avatar?: {
      url: string;
    };
  };
  department?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  viewCount: number;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
}

interface CreateAnnouncementData {
  title: string;
  content: string;
  type: string;
  priority: string;
  departmentId?: string;
  expiresAt?: string;
  attachments?: File[];
}

const adminAnnouncementService = {
  getAll: async () => {
    try {
      const response: AxiosResponse<{ success: boolean; data: AdminAnnouncement[] }> = 
        await apiClient.get('/announcements');
      const announcements = response.data.data;
      
      // Kiểm tra và cập nhật trạng thái dựa trên thời gian hết hạn
      return announcements.map((announcement: AdminAnnouncement) => {
        const isExpired = new Date(announcement.expiresAt) < new Date();
        if (isExpired && announcement.status === 'active') {
          // Tự động cập nhật status nếu đã hết hạn
          adminAnnouncementService.updateStatus(announcement._id, 'expired');
          return { ...announcement, status: 'expired' };
        }
        return announcement;
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  create: async (data: FormData) => {
    try {
      // Handle image uploads first
      if (data.has('images')) {
        const files = Array.from(data.getAll('images') as File[]);
        const uploadedFiles = await uploadService.uploadEventImages(files);
        
        // Remove original files and append uploaded image data
        data.delete('images');
        uploadedFiles.forEach((image, index) => {
          data.append(`images[${index}][public_id]`, image.public_id);
          data.append(`images[${index}][url]`, image.url);
        });
      }

      const response = await apiClient.post('/announcements', data);
      return response.data.data;
    } catch (error) {
      console.error('Announcement creation error:', error);
      throw error;
    }
  },

  update: async (id: string, data: FormData) => {
    try {
      // Create a new FormData for sending
      const formDataToSend = new FormData();

      // Copy all fields except images
      for (const [key, value] of data.entries()) {
        if (key !== 'images' && key !== 'existingImages') {
          formDataToSend.append(key, value);
        }
      }

      // Prepare final images array
      const finalImages = [];

      // Handle existing images
      if (data.has('existingImages')) {
        const existingImages = JSON.parse(data.get('existingImages') as string);
        finalImages.push(...existingImages);
      }

      // Upload new images to Cloudinary if any
      if (data.has('images')) {
        const files = Array.from(data.getAll('images') as File[]);
        if (files.length > 0) {
          const uploadedFiles = await uploadService.uploadEventImages(files);
          finalImages.push(...uploadedFiles);
        }
      }

      // Add images array in the format backend expects
      finalImages.forEach((image, index) => {
        formDataToSend.append(`images[${index}][public_id]`, image.public_id);
        formDataToSend.append(`images[${index}][url]`, image.url);
      });

      const response = await apiClient.put(`/announcements/${id}`, formDataToSend);
      return response.data.data;
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      await apiClient.delete(`/announcements/${id}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: 'active' | 'expired' | 'archived' | 'published' | 'draft') => {
    try {
      const response = await apiClient.patch(`/announcements/${id}/status`, { status });
      return response.data.data;
    } catch (error) {
      console.error('Error updating announcement status:', error);
      throw error;
    }
  }
};

export default adminAnnouncementService;
