import apiClient from '../api/apiClient';
import { User } from '../types';

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

  getUserById: async (userId: string): Promise<User | null> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data?.data || null;
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
};

export default userService;
