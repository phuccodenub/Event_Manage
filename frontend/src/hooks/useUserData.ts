import { useQuery } from '@tanstack/react-query';
import authService from '../services/authService';
import { User } from '../types';

// Định nghĩa interface cho lỗi API
interface ApiError {
  status?: number;
  message?: string;
}

/**
 * Custom hook to fetch and cache user profile data
 * Uses React Query for efficient caching and stale-while-revalidate pattern
 */
export const useUserData = () => {
  const { 
    data: user,
    isLoading: loading,
    error,
    refetch
  } = useQuery<User | null, Error>({
    queryKey: ['userData'],
    queryFn: async () => {
      try {
        return await authService.getProfile();
      } catch (err) {
        // Nếu gặp lỗi 401, không ném lỗi để tránh redirect loop
        if ((err as ApiError)?.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: 1, // Chỉ thử lại 1 lần nếu gặp lỗi
    retryDelay: 1000, // Delay 1 giây trước khi thử lại
    staleTime: 5 * 60 * 1000, // 5 phút
  });

  return {
    user,
    loading,
    error: error?.message || null,
    refetchUserData: refetch
  };
}; 