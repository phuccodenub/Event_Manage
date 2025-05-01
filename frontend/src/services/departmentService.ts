import apiClient from '../api/apiClient';
import type { Department } from '@/types';

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
  }
};

export default departmentService;
