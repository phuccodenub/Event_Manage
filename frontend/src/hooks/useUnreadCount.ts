import { useQuery } from '@tanstack/react-query';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

interface UnreadCountData {
  unreadCount: number;
}

/**
 * Hook để lấy và theo dõi số lượng thông báo chưa đọc
 * Sử dụng React Query để quản lý cache và chỉ cập nhật khi cần thiết
 */
export const useUnreadCount = () => {
  const { user, isAuthenticated } = useAuth();

  // Sử dụng React Query thay vì tự quản lý state và fetch
  const { 
    data = { unreadCount: 0 }, 
    isLoading: loading, 
    error, 
    refetch: refreshUnreadCount 
  } = useQuery<UnreadCountData, Error, UnreadCountData, [string, string | undefined]>({
    queryKey: ['unreadCount', user?._id],
    queryFn: async () => {
      if (!isAuthenticated || !user) {
        return { unreadCount: 0 };
      }
      
      const result = await notificationService.getUnreadCount();
      
      // Xử lý cấu trúc dữ liệu trả về từ API
      // API trả về { success: true, data: number } thay vì { unreadCount: number }
      if (result && typeof result.data === 'number') {
        return { unreadCount: result.data };
      }
      
      return { unreadCount: 0 };
    },
    enabled: !!isAuthenticated && !!user,
    // Loại bỏ refetchInterval để ngăn việc gọi API liên tục
    // Dựa vào socket events và manual invalidation
    staleTime: 0, // Đảm bảo refetch khi invalidate
    gcTime: 30 * 60 * 1000, // Cache trong 30 phút (trước đây là cacheTime)
    refetchOnWindowFocus: false, // Không refetch khi focus window
    refetchOnMount: true, // Chỉ fetch lần đầu khi mount
    refetchOnReconnect: false,
    retry: 1
  });

  return {
    unreadCount: data.unreadCount,
    loading,
    error,
    refreshUnreadCount
  };
}; 