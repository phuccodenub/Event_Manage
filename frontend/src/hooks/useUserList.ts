import { useState, useEffect } from 'react';
import apiClient from '@/api/apiClient';
import type { User } from '@/types';

export const useUserList = (roles?: string | string[]) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const rolesParam = Array.isArray(roles) ? roles.join(',') : roles;
        const response = await apiClient.get('/users', {
          params: rolesParam ? { roles: rolesParam } : undefined
        });
        setUsers(response.data?.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [JSON.stringify(roles)]); // Stabilize dependency

  return { users, loading };
};
