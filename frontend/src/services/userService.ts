import apiClient from '../api/apiClient';
import { User } from '../types';

interface ApiError {
  success?: boolean;
  message?: string;
  error?: string;
  status?: number;
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
  };
}

const userService = {
  getProfile: async (): Promise<User | null> => {
    const response = await apiClient.get('/users/me');
    return response.data?.data || null;
  },

  updateProfile: async (userData: FormData): Promise<User> => {
    const response = await apiClient.put('/users/me', userData);
    return response.data?.data;
  },

  updateAvatar: async (file: File): Promise<User> => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.put('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to update avatar');
      }
      
      return response.data.data;
    } catch (error: any) {
      console.error('Avatar upload error:', error.response || error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Error updating avatar'
      );
    }
  },

  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<User> => {
    const response = await apiClient.put('/users/me/password', passwordData);
    return response.data?.data;
  },

  getUserById: async (id: string): Promise<User> => {
    try {
      console.log('Fetching user:', `/users/${id}`); // Debug log

      const response = await apiClient.get(`/users/${id}`);
      console.log('Response:', response.data); // Debug log

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user data');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error details:', error.response || error); // Debug log
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch user'
      );
    }
  },

  getRegisteredEvents: async (): Promise<User[]> => {
    const response = await apiClient.get('/users/me/events');
    return response.data?.data || [];
  },

  deleteAvatar: async (): Promise<User> => {
    const response = await apiClient.delete('/users/me/avatar');
    return response.data?.data;
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get('/users');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  createUser: async (userData: Partial<User>) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating user:', error.response?.data || error.message);
      throw error;
    }
  },

  updateUser: async (id: string, userData: any) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data.data;
  },

  deleteUser: async (id: string) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data.data;
  },

  resetPassword: async (userId: string): Promise<any> => {
    const response = await apiClient.post(`/users/${userId}/reset-password`);
    return response.data;
  },

  getUserEvents: async (userId: string) => {
    try {
      console.log(`Đang tải danh sách sự kiện cho user: ${userId}`);
      const response = await apiClient.get(`/users/${userId}/events`);
      
      if (!response.data?.success) {
        throw { 
          success: false, 
          message: response.data?.message || 'Không thể tải danh sách sự kiện',
          error: response.data?.error || 'Unknown error'
        };
      }
      
      console.log(`Loaded ${response.data?.data?.length || 0} events successfully`);
      return response.data?.data || [];
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching user events:', apiError);
      
      if (apiError.response?.status === 404) {
        throw { ...apiError, message: 'Không tìm thấy người dùng hoặc sự kiện' };
      }
      
      if (apiError.response?.status === 403) {
        throw { ...apiError, message: 'Không có quyền xem sự kiện của người dùng này' };
      }
      
      throw { 
        ...apiError, 
        message: apiError.response?.data?.message || 
                 apiError.message || 
                 'Lỗi khi tải dữ liệu sự kiện' 
      };
    }
  }
};

export default userService;
