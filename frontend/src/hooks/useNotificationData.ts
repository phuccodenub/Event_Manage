import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationService from '../services/notificationService';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../context/NotificationContext';

// Định nghĩa kiểu dữ liệu có thể nhận được từ API
interface NotificationResponse {
  notifications?: Notification[];
  unreadCount?: number;
  success?: boolean;
  data?: number | { unreadCount?: number };
  [key: string]: unknown;
}

interface NotificationsData {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Custom hook to fetch and manage notifications data
 * Uses React Query for efficient caching and state management
 */
export const useNotificationData = () => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  // Query for fetching notifications
  const { 
    data = { notifications: [], unreadCount: 0 }, 
    isLoading, 
    error, 
    refetch: refetchNotifications
  } = useQuery<NotificationsData, Error, NotificationsData, [string, string | undefined]>({
    queryKey: ['notifications', user?._id],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !user?._id) {
          return { notifications: [], unreadCount: 0 };
        }
        
        const result = await notificationService.getNotifications() as NotificationResponse;
        
        // Đảm bảo notifications trả về là mảng
        const notifications = Array.isArray(result.notifications) ? result.notifications : [];
        
        // Đảm bảo unreadCount là số
        let unreadCount = 0;
        
        if (typeof result.unreadCount === 'number') {
          unreadCount = result.unreadCount;
        } else if (result.data !== undefined) {
          if (typeof result.data === 'number') {
            unreadCount = result.data;
          } else if (typeof result.data === 'object' && result.data !== null && typeof result.data.unreadCount === 'number') {
            unreadCount = result.data.unreadCount;
          }
        }
        
        return { notifications, unreadCount };
      } catch (err) {
        console.error('Error fetching notifications:', err);
        return { notifications: [], unreadCount: 0 };
      }
    },
    enabled: !!isAuthenticated && !!user?._id,
    // Loại bỏ polling liên tục
    staleTime: 0, // Đảm bảo refetch khi invalidate
    gcTime: 30 * 60 * 1000, // Cache trong 30 phút
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });

  // Cập nhật localUnreadCount mỗi khi data thay đổi
  useEffect(() => {
    if (data && typeof data.unreadCount === 'number') {
      setLocalUnreadCount(data.unreadCount);
    }
  }, [data]);

  // Mutation for marking a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => {
      return notificationService.markAsRead(notificationId);
    },
    onSuccess: () => {
      // Giảm unreadCount đi 1 ngay lập tức
      setLocalUnreadCount(prev => Math.max(0, prev - 1));
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  });

  // Mutation for marking all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => {
      return notificationService.markAllAsRead();
    },
    onSuccess: () => {
      // Đặt unreadCount về 0 ngay lập tức
      setLocalUnreadCount(0);
      // Invalidate các queries liên quan
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    }
  });

  return {
    notifications: data.notifications || [],
    unreadCount: localUnreadCount,
    loading: isLoading,
    error,
    refetchNotifications,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
}; 