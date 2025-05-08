import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Department, User } from '@/types';
import departmentService from '@/services/departmentService';

interface DepartmentContextType {
  departments: Department[];
  loading: boolean;
  error: string | null;
  fetchDepartments: () => Promise<void>;
  createDepartment: (data: Partial<Department>) => Promise<void>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  selectedDepartment: Department | null;
  setSelectedDepartment: (department: Department | null) => void;
  updateDepartmentHead: (departmentId: string, userId: string) => Promise<void>;
  updateDepartmentRoles: (
    departmentId: string,
    role: 'administrators' | 'moderators',
    userId: string,
    action: 'add' | 'remove'
  ) => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(undefined);

export const DepartmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await departmentService.getAllDepartments();
      setDepartments(data);
      if (selectedDepartment) {
        const updated = data.find(d => d._id === selectedDepartment._id);
        if (updated) setSelectedDepartment(updated);
      }
    } catch (error) {
      setError('Error fetching departments');
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  const createDepartment = useCallback(async (data: Partial<Department>) => {
    try {
      const newDepartment = await departmentService.createDepartment(data);
      setDepartments(prev => [...prev, newDepartment]);
    } catch (error) {
      setError('Error creating department');
      throw error;
    }
  }, []);

  const updateDepartment = useCallback(async (id: string, data: Partial<Department>) => {
    try {
      const updatedDepartment = await departmentService.updateDepartment(id, data);
      setDepartments(prev =>
        prev.map(dept => (dept._id === id ? updatedDepartment : dept))
      );
      if (selectedDepartment?._id === id) {
        setSelectedDepartment(updatedDepartment);
      }
    } catch (error) {
      setError('Error updating department');
      throw error;
    }
  }, [selectedDepartment]);

  const deleteDepartment = useCallback(async (id: string) => {
    try {
      await departmentService.deleteDepartment(id);
      setDepartments(prev => prev.filter(dept => dept._id !== id));
      if (selectedDepartment?._id === id) {
        setSelectedDepartment(null);
      }
    } catch (error) {
      setError('Error deleting department');
      throw error;
    }
  }, [selectedDepartment]);

  const updateDepartmentHead = useCallback(async (departmentId: string, userId: string) => {
    try {
      const updatedDepartment = await departmentService.assignHead(departmentId, userId);
      setDepartments(prev =>
        prev.map(dept =>
          dept._id === departmentId
            ? { ...dept, head: updatedDepartment.head }
            : dept
        )
      );
      if (selectedDepartment?._id === departmentId) {
        setSelectedDepartment(prev => prev ? { ...prev, head: updatedDepartment.head } : null);
      }
    } catch (error) {
      setError('Error updating department head');
      throw error;
    }
  }, [selectedDepartment]);

  const updateDepartmentRoles = useCallback(async (
    departmentId: string,
    role: 'administrators' | 'moderators',
    userId: string,
    action: 'add' | 'remove'
  ) => {
    try {
      const updatedDepartment = await departmentService.updateDepartmentRoles(
        departmentId,
        role,
        userId,
        action
      );
      setDepartments(prev =>
        prev.map(dept =>
          dept._id === departmentId
            ? {
                ...dept,
                [role]: updatedDepartment[role],
                head: updatedDepartment.head
              }
            : dept
        )
      );
      if (selectedDepartment?._id === departmentId) {
        setSelectedDepartment(updatedDepartment);
      }
    } catch (error) {
      setError('Error updating department roles');
      throw error;
    }
  }, [selectedDepartment]);

  return (
    <DepartmentContext.Provider value={{
      departments,
      loading,
      error,
      fetchDepartments,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      selectedDepartment,
      setSelectedDepartment,
      updateDepartmentHead,
      updateDepartmentRoles,
    }}>
      {children}
    </DepartmentContext.Provider>
  );
};

export const useDepartment = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartment must be used within a DepartmentProvider');
  }
  return context;
};
