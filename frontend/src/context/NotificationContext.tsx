import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import { toast } from 'react-toastify';

interface NotificationContextProps {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  filterNotifications: (filter: string, period: string) => any[];
}

const NotificationContext = createContext<NotificationContextProps>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  fetchNotifications: async () => {},
  filterNotifications: () => []
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const { notifications = [], unreadCount = 0 } = await notificationService.getNotifications();
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set default values on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const filterNotifications = useCallback((filter: string, period: string) => {
    let filtered = [...notifications];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(notification => {
        switch (filter) {
          case 'unread': return !notification.read;
          case 'events': return notification.type.includes('event');
          case 'system': return notification.type === 'system';
          default: return true;
        }
      });
    }

    // Apply time period
    if (period !== 'all') {
      const now = new Date();
      filtered = filtered.filter(notification => {
        const notifDate = new Date(notification.createdAt);
        switch (period) {
          case 'today':
            return notifDate.toDateString() === now.toDateString();
          case 'week':
            return notifDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'month':
            return notifDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [notifications]);

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io('http://localhost:5000', {
      query: { userId: user._id },
      transports: ['websocket'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.info(notification.message);
    });

    newSocket.on('unreadCount', ({ count }) => {
      setUnreadCount(count);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    // Fetch initial notifications
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map((n: any) => n._id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map((n: any) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
      filterNotifications
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
