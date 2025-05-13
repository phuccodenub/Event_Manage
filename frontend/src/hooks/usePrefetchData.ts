import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import authService from '../services/authService';
import eventService from '../services/eventService';
import notificationService from '../services/notificationService';

/**
 * Hook để prefetch các dữ liệu phổ biến khi ứng dụng khởi động
 * Giúp giảm thời gian loading khi chuyển trang
 */
export const usePrefetchData = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Kiểm tra token trước khi thực hiện prefetch
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) {
      console.log('Not prefetching data - user not authenticated');
      return;
    }

    // Async function để prefetch dữ liệu
    const prefetchData = async () => {
      try {
        console.log('Prefetching data for authenticated user');
        
        // Prefetch user data
        await queryClient.prefetchQuery({
          queryKey: ['userData'],
          queryFn: () => authService.getProfile(),
        });

        // Prefetch events data
        await queryClient.prefetchQuery({
          queryKey: ['events'],
          queryFn: () => eventService.getAllEvents(),
        });

        // Prefetch notifications
        await queryClient.prefetchQuery({
          queryKey: ['notifications'],
          queryFn: () => notificationService.getNotifications(),
        });

        // Prefetch community data nếu đang sử dụng mock data
        await queryClient.prefetchQuery({
          queryKey: ['communityGroups'],
          queryFn: async () => {
            // Mô phỏng API call
            await new Promise(resolve => setTimeout(resolve, 100));
            return [];
          },
        });
        
        console.log('All data prefetched successfully');
      } catch (error) {
        console.error('Error during prefetch:', error);
        // Không throw lỗi để không ảnh hưởng tới render
      }
    };

    // Chạy prefetch
    prefetchData();
  }, [queryClient]);
}; 