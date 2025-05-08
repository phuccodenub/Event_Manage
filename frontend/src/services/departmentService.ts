import apiClient from '../api/apiClient';
import type { Department } from '@/types';
import type { Department as DepartmentType } from '../types';

const departmentService = {
  getAllDepartments: async () => {
    try {
      const response = await apiClient.get('/departments');
      return response.data?.data || []; // API returns { success: true, data: [...] }
    } catch (error) {
      console.error('Error fetching departments:', error);
      throw error;
    }
  },

  getDepartmentById: async (id: string) => {
    try {
      const response = await apiClient.get(`/departments/${id}`);
      return response.data?.data;
    } catch (error) {
      console.error('Error fetching department:', error);
      throw error;
    }
  },

  createDepartment: async (departmentData: Partial<Department>) => {
    try {
      const response = await apiClient.post('/departments', departmentData);
      return response.data.data;
    } catch (error) {
      console.error('Department creation error:', error);
      throw error;
    }
  },

  updateDepartment: async (id: string, departmentData: Partial<Department>) => {
    try {
      const response = await apiClient.put(`/departments/${id}`, departmentData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating department:', error);
      throw error;
    }
  },

  deleteDepartment: async (id: string) => {
    try {
      await apiClient.delete(`/departments/${id}`);
    } catch (error) {
      console.error('Error deleting department:', error);
      throw error;
    }
  },

  assignHead: async (departmentId: string, userId: string) => {
    try {
      const response = await apiClient.put(`/departments/${departmentId}/head`, { userId });
      return response.data.data;
    } catch (error) {
      console.error('Error assigning department head:', error);
      throw error;
    }
  },

  getDepartmentHead: async (departmentId: string) => {
    try {
      const response = await apiClient.get(`/departments/${departmentId}/head`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching department head:', error);
      throw error;
    }
  },

  getDepartmentDetail: async (id: string): Promise<DepartmentType> => {
    try {
      const response = await apiClient.get(`/departments/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching department detail:', error);
      throw error;
    }
  },

  followDepartment: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/departments/${id}/follow`);
    } catch (error) {
      console.error('Error following department:', error);
      throw error;
    }
  },

  unfollowDepartment: async (id: string): Promise<void> => {
    try {
      await apiClient.post(`/departments/${id}/unfollow`);
    } catch (error) {
      console.error('Error unfollowing department:', error);
      throw error;
    }
  },

  getEvents: async (id: string, params?: any) => {
    try {
      const response = await apiClient.get(`/departments/${id}/events`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching department events:', error);
      throw error;
    }
  },

  getAnnouncements: async (id: string, params?: any) => {
    try {
      const response = await apiClient.get(`/departments/${id}/announcements`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching department announcements:', error);
      throw error;
    }
  },

  getMembers: async (id: string, params?: any) => {
    try {
      const response = await apiClient.get(`/departments/${id}/members`, { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching department members:', error);
      throw error;
    }
  },

  updateDepartmentRoles: async (
    departmentId: string,
    role: 'administrators' | 'moderators',
    userId: string,
    action: 'add' | 'remove'
  ): Promise<Department> => {
    try {
      const response = await apiClient.put(`/departments/${departmentId}/roles`, {
        role,
        userId,
        action
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update department roles');
    }
  },

  getDepartmentMembers: async (departmentId: string) => {
    const response = await apiClient.get(`/departments/${departmentId}/members`);
    return response.data.data;
  }
};

export default departmentService;
