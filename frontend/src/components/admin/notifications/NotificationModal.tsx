import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon, BellIcon, CheckIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import adminNotificationService from '@/services/adminNotificationService';

interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: string;
  link?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AdminNotification[];
  onMarkAsRead: (id: string) => void;
}

const NotificationModal = ({ isOpen, onClose, notifications, onMarkAsRead }: NotificationModalProps) => {
  return (
    <Transition
      show={isOpen}
      as={Fragment}
      enter="transition ease-out duration-200"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-150"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <div className="absolute right-0 mt-2 w-[380px] origin-top-right z-[9999]">
        <div className="rounded-xl bg-white shadow-xl ring-1 ring-black/5 overflow-hidden">
          {/* Header với gradient orange và màu chữ rõ ràng hơn */}
          <div className="bg-orange-600 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <BellIcon className="h-6 w-6 text-white" />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white">Thông báo</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
                >
                  <XIcon className="h-5 w-5 text-white" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">
                  {notifications.filter(n => !n.read).length} thông báo chưa đọc
                </p>
                <button 
                  className="text-xs text-white/80 hover:text-white hover:underline transition-colors"
                  onClick={() => {/* Handle mark all */}}
                >
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
            </div>
          </div>

          {/* Notification List với chiều cao tối ưu */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <BellIcon className="h-7 w-7 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Không có thông báo</p>
                <p className="text-sm text-gray-400 mt-1">Bạn sẽ nhận được thông báo tại đây</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id}
                    onClick={() => onMarkAsRead(notification._id)}
                    className={`group p-3.5 hover:bg-gray-50 cursor-pointer transition-all duration-200
                      ${getNotificationBackground(notification.type, notification.read)}`}
                  >
                    <div className="flex gap-3">
                      {/* Icon với hiệu ứng hover mượt mà */}
                      <div className={`relative flex-shrink-0 w-10 h-10 rounded-full
                        ${getNotificationTypeStyles(notification.type)} 
                        flex items-center justify-center shadow-sm
                        group-hover:scale-105 transform transition-all duration-300 ease-out`}
                      >
                        {getNotificationIcon(notification.type)}
                        {!notification.read && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-[13px] line-clamp-1 mb-0.5 group-hover:text-orange-600 transition-colors">
                          {notification.title}
                        </p>
                        <p className="text-[13px] text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1.5">
                          <time className="text-[11px] text-gray-400 tabular-nums">
                            {format(new Date(notification.createdAt), 'HH:mm - dd/MM', { locale: vi })}
                          </time>
                          {notification.link && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <a 
                                href={notification.link}
                                className="text-[11px] text-orange-600 hover:text-orange-700 font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Chi tiết →
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer với nút orange */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {/* Handle view all */}}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg 
                px-4 py-2.5 text-[13px] transition-all flex items-center justify-center gap-2"
            >
              <span>Xem tất cả</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
};

// Helper functions với màu orange
const getNotificationTypeStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'event':
      return 'bg-orange-100 text-orange-600';
    case 'warning':
      return 'bg-orange-100 text-orange-600';
    case 'success':
      return 'bg-orange-100 text-orange-600';
    case 'error':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-orange-100 text-orange-600';
  }
};

const getNotificationIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'event':
      return <BellIcon className="h-5 w-5" />;
    case 'warning':
      return <BellIcon className="h-5 w-5" />;
    case 'success':
      return <CheckIcon className="h-5 w-5" />;
    case 'error':
      return <XIcon className="h-5 w-5" />;
    default:
      return <BellIcon className="h-5 w-5" />;
  }
};

const getNotificationBackground = (type: string, isRead: boolean) => {
  if (isRead) return 'bg-white';
  return 'bg-orange-50';
};

export default NotificationModal;
