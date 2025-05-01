import React, { useRef, useEffect, useMemo } from 'react';
import { IoTimeOutline, IoCheckmarkCircleOutline, IoCalendarOutline, IoLocationOutline, IoNotificationsOffOutline, IoFlameOutline } from 'react-icons/io5';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useNotifications } from '../context/NotificationContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { notifications, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('Đã đánh dấu tất cả là đã đọc');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông báo');
    }
  };

  const recentNotifications = useMemo(() => 
    notifications.slice(0, 5),
    [notifications]
  );

  const handleNotificationClick = async (notification: any) => {
    try {
      await markAsRead(notification._id);
      if (notification.relatedModel && notification.relatedId) {
        const path = notification.relatedModel.toLowerCase();
        navigate(`/${path}s/${notification.relatedId}`);
        onClose();
      } else if (notification.link) {
        navigate(notification.link);
        onClose();
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 w-[380px] z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <IoNotificationsOffOutline className="w-5 h-5 text-orange-600" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-50 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-600 text-[10px] text-white items-center justify-center font-medium">
                    {notifications.filter((n) => !n.read).length}
                  </span>
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Thông báo mới</h3>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50/80 transition-colors"
            >
              Đánh dấu tất cả là đã đọc
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="max-h-[480px] overflow-y-auto">
          {recentNotifications.length > 0 ? (
            <div className="p-3 grid gap-2">
              {recentNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`relative group rounded-xl p-4 cursor-pointer
                    ${!notification.read ? 'bg-orange-50/50' : 'bg-white'}`}
                >
                  {/* Hover Effect Border */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-orange-200/50 transition-colors" />

                  <div className="relative flex gap-4">
                    {/* Animated Icon Container */}
                    <div className={`relative flex-shrink-0 w-12 h-12 rounded-xl
                      ${getNotificationTypeStyles(notification.type)}
                      group-hover:scale-110 transform transition-all duration-300
                      before:absolute before:inset-0 before:rounded-xl
                      before:bg-black/5 before:opacity-0 group-hover:before:opacity-100
                      before:transition-opacity
                    `}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                      {!notification.read && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full ring-2 ring-white" />
                      )}
                    </div>

                    {/* Content with Enhanced Typography */}
                    <div className="flex-1 min-w-0 relative">
                      <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {notification.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>

                      {notification.eventDetails && (
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <IoCalendarOutline className="text-orange-500" />
                            <span className="group-hover:text-orange-600 transition-colors">
                              {notification.eventDetails.date}
                            </span>
                          </div>
                          <div className="h-1 w-1 rounded-full bg-gray-300" />
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <IoLocationOutline className="text-orange-500" />
                            <span className="group-hover:text-orange-600 transition-colors">
                              {notification.eventDetails.location}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <span className="absolute top-0 right-0 text-xs text-gray-400 group-hover:text-orange-500 transition-colors">
                        {formatTimeAgo(new Date(notification.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <IoNotificationsOffOutline className="mx-auto text-4xl mb-2" />
              <p>Không có thông báo mới</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <Link
            to="/notifications"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors inline-flex items-center justify-center"
          >
            <span>Xem tất cả thông báo</span>
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper functions for styling
const getNotificationTypeStyles = (type: string) => {
  switch (type) {
    case 'event':
      return 'bg-orange-100 text-orange-600';
    case 'reminder':
      return 'bg-blue-100 text-blue-600';
    case 'success':
      return 'bg-green-100 text-green-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getNotificationIcon = (type: string) => {
  const iconClass = "text-2xl";
  switch (type) {
    case 'event':
      return <IoTimeOutline className={iconClass} />;
    case 'reminder':
      return <IoCalendarOutline className={iconClass} />;
    case 'success':
      return <IoCheckmarkCircleOutline className={iconClass} />;
    default:
      return <IoNotificationsOffOutline className={iconClass} />;
  }
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return date.toLocaleDateString();
};

export default NotificationDropdown;
