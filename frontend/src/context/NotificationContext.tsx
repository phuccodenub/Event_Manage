import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from './AuthContext';
// import notificationService from '../services/notificationService';
import { useNotificationData } from '../hooks/useNotificationData';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import EventNotification from '../components/EventNotification';
// import { toast } from 'react-toastify';

// Thêm _id vào type User
declare module '../types' {
  interface User {
    _id?: string;
  }
}

export interface Notification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: 'event' | 'announcement' | 'system' | 'event_joined' | 'event_confirmation' | 'event_reminder' | 'event_left' | 'event_left_confirmation' | 'new_event' | 'new_announcement';
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  link?: string;
  relatedId?: string;
  relatedModel?: string;
  sender?: {
    _id: string;
    fullName: string;
    avatar?: {
      url: string;
    };
  };
  [key: string]: unknown;
}

interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => void;
  filterNotifications: (type?: string, period?: string) => Notification[];
  updateUnreadCount: () => void;
  reconnectSocket: () => void;
}

const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  fetchNotifications: () => {},
  filterNotifications: () => [],
  updateUnreadCount: () => {},
  reconnectSocket: () => {}
});

// Tạo một socket instance duy nhất
let socketInstance: Socket | null = null;

// Tạo một biến để lưu trữ timeout ID thay vì sử dụng window
let notificationTimeoutId: NodeJS.Timeout | null = null;

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  // Use our React Query hook for notifications
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead
  } = useNotificationData();
  
  // Sử dụng useRef để tránh vòng lặp vô hạn
  const socketInitialized = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const refetchingRef = useRef(false);

  const queryClient = useQueryClient();

  // Tạo một hàm fetchNotifications đảm bảo chỉ gọi API một lần nếu đang trong quá trình fetch
  const fetchNotifications = useCallback(() => {
    // Không cần kiểm tra user._id, React Query đã xử lý trong hook
    if (!refetchingRef.current) {
      refetchingRef.current = true;
      try {
        // Sử dụng invalidateQueries thay vì gọi refetch trực tiếp
        queryClient.invalidateQueries({ queryKey: ['notifications', user?._id] });
        queryClient.invalidateQueries({ queryKey: ['unreadCount', user?._id] });
      } finally {
        // Đặt timeout để chỉ cho phép fetch lại sau khoảng thời gian
        setTimeout(() => {
          refetchingRef.current = false;
        }, 1000);
      }
    }
  }, [user?._id, queryClient]);

  const updateUnreadCount = useCallback(() => {
    // React Query automatically handles this for us now
    queryClient.invalidateQueries({ queryKey: ['unreadCount', user?._id] });
  }, [user?._id, queryClient]);

  // Socket connection for real-time notifications
  const setupSocket = useCallback(() => {
    if (!user?._id || socketInitialized.current) return;

    socketInstance = socketRef.current = io(
      import.meta.env.VITE_API_URL || window.location.origin.replace(/:\d+$/, ':5000'),
      {
        query: { userId: user._id },
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        withCredentials: true,
      }
    );

    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance?.id);
      socketInitialized.current = true;
    });

    socketInstance.on('newNotification', (data) => {
      console.log('New notification received:', data);
      console.log('Notification type:', data.type);
      
      // Trực tiếp cập nhật state mà không sử dụng Timeout
      // NGAY LẬP TỨC invalidate queries để refresh data
      queryClient.invalidateQueries({ queryKey: ['notifications', user?._id] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount', user?._id] });
      
      // Force refetch ngay lập tức để không phải đợi React Query tự làm
      queryClient.refetchQueries({ queryKey: ['notifications', user?._id], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['unreadCount', user?._id], type: 'active' });
      
      // Hiển thị toast message ngay lập tức khi có thông báo mới và đặt className đẹp hơn
      if (data.type === 'event' || data.type === 'announcement' || data.type === 'system' || 
          data.type === 'event_joined' || data.type === 'event_confirmation' || 
          data.type === 'event_reminder' || data.type === 'event_left' || 
          data.type === 'event_left_confirmation' || data.type === 'new_event' || data.type === 'new_announcement') {
        // Format the toast message for different notification types
        let toastMessage = `${data.title || 'Thông báo mới'}`;
        if (data.message) {
          toastMessage += `: ${data.message}`;
        }
        
        // Choose toast type based on notification type
        switch (data.type) {
          case 'event':
          case 'event_joined':
          case 'event_confirmation':
          case 'event_reminder':
          case 'new_event':
            toast(
              <EventNotification 
                key={data._id || new Date().getTime()}
                title={data.title || 'Thông báo sự kiện'}
                message={data.message || ''}
                time={new Date(data.createdAt || new Date())}
                type="event"
                sender={data.sender}
              />,
              {
                position: 'bottom-left',
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: 'notification-toast notification-event',
                containerId: 'event-notifications'
              }
            );
            break;
          case 'event_left':
          case 'event_left_confirmation':
            toast(
              <EventNotification 
                key={data._id || new Date().getTime()}
                title={data.title || 'Thông báo sự kiện'}
                message={data.message || ''}
                time={new Date(data.createdAt || new Date())}
                type="warning"
                sender={data.sender}
              />,
              {
                position: 'bottom-left',
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: 'notification-toast notification-warning',
                containerId: 'event-notifications'
              }
            );
            break;
          case 'announcement':
          case 'new_announcement':
            toast(
              <EventNotification 
                key={data._id || new Date().getTime()}
                title={data.title || 'Thông báo mới'}
                message={data.message || ''}
                time={new Date(data.createdAt || new Date())}
                type="event"
                sender={data.sender}
              />,
              {
                position: 'bottom-left',
                autoClose: 5000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                className: 'notification-toast notification-announcement',
                containerId: 'event-notifications'
              }
            );
            break;
          default:
            toast.info(toastMessage, {
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              className: 'notification-toast'
            });
        }
        
        // Play a notification sound if browser supports it
        try {
          // Use a small beep sound for all notifications that's more likely to be allowed by browsers
          const notificationSound = new Audio('/sounds/notification.mp3');
          notificationSound.volume = 0.3; // Lower volume to be less intrusive
          
          // Try to handle autoplay restrictions more gracefully
          const playAudio = async () => {
            try {
              // First try to check if we have permission to play audio
              if (document.visibilityState === 'visible') {
                await notificationSound.play();
              }
            } catch {
              console.log('Could not autoplay notification sound due to browser restrictions');
              
              // Browsers typically require a user interaction before allowing audio
              // We can't force this, but at least we provide info in the console
            }
          };
          
          playAudio();
        } catch (error) {
          console.log('Audio playback not supported', error);
        }
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      socketInitialized.current = false;
    });

    socketInstance.on('unreadCount', (data) => {
      console.log('Unread count updated:', data);
      // Immediately update the unreadCount in React Query
      queryClient.setQueryData(['unreadCount', user?._id], { unreadCount: data.count });
    });

    return () => {
      if (notificationTimeoutId) {
        clearTimeout(notificationTimeoutId);
        notificationTimeoutId = null;
      }
      socketInstance?.disconnect();
      socketRef.current = null;
      socketInitialized.current = false;
    };
  }, [user?._id, queryClient]);

  const reconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      socketInitialized.current = false;
    }
    setupSocket();
  }, [setupSocket]);

  // Chỉ gọi setup một lần khi component mount hoặc user thay đổi
  useEffect(() => {
    let isMounted = true;
    
    if (user?._id && isMounted) {
      // Chỉ fetch notifications một lần khi component mount
      if (!refetchingRef.current) {
        fetchNotifications();
      }
      setupSocket();
      
      // Kiểm tra connection của socket
      const checkConnection = setInterval(() => {
        if (!socketRef.current?.connected && user?._id) {
          console.log('Socket disconnected, attempting to reconnect...');
          reconnectSocket();
        }
      }, 5000); // Kiểm tra mỗi 5 giây
      
      return () => {
        clearInterval(checkConnection);
        isMounted = false;
        if (notificationTimeoutId) {
          clearTimeout(notificationTimeoutId);
          notificationTimeoutId = null;
        }
        socketRef.current?.disconnect();
      };
    }
  }, [user?._id, fetchNotifications, reconnectSocket, setupSocket]); // Thêm các dependencies cần thiết

  const filterNotifications = useCallback((type?: string, period?: string) => {
    let filtered = [...notifications];

    // Filter by type
    if (type && type !== 'all') {
      if (type === 'unread') {
        filtered = filtered.filter(notification => !notification.read);
      } else {
        filtered = filtered.filter(notification => notification.type === type);
      }
    }

    // Filter by time period
    if (period && period !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        switch (period) {
          case 'today':
            return notificationDate >= today;
          case 'week':
            return notificationDate >= weekAgo;
          case 'month':
            return notificationDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [notifications]);

  // Convert markNotificationAsRead from mutate to Promise-based function for compatibility
  const markAsRead = async (id: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        markNotificationAsRead(id);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  // Convert markAllNotificationsAsRead from mutate to Promise-based function for compatibility
  const markAllAsRead = async () => {
    return new Promise<void>((resolve, reject) => {
      try {
        markAllNotificationsAsRead();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
      filterNotifications,
      updateUnreadCount,
      reconnectSocket
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Hàm tiện ích để kiểm tra kết nối socket từ bên ngoài
export const getSocketStatus = () => {
  return {
    connected: socketInstance?.connected || false,
    id: socketInstance?.id
  };
};
