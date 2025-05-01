import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import Sidebar from './Sidebar';
import { 
  BellIcon, 
  UserCircleIcon, 
  MenuIcon, 
  XIcon 
} from '@heroicons/react/outline';
import authService from '@/services/authService';
import notificationService from '@/services/notificationService';
import adminNotificationService from '@/services/adminNotificationService';
import NotificationModal from './notifications/NotificationModal';
import type { User } from '@/types';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [location, setLocation] = useLocation(); // wouter uses setLocation instead of navigate
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await authService.getProfile();
      setUser(userData);
    };
    loadUser();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { notifications: notifs, unreadCount: count } = await adminNotificationService.getNotifications();
      setNotifications(notifs); 
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminNotificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Tạo breadcrumbs từ current path
  const getBreadcrumbs = () => {
    const paths = location.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      name: path.charAt(0).toUpperCase() + path.slice(1),
      href: '/' + paths.slice(0, index + 1).join('/'),
      current: index === paths.length - 1
    }));
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: 'fas fa-tachometer-alt', text: 'Dashboard' },
    { path: '/admin/events', icon: 'fas fa-calendar-alt', text: 'Events' },
    { path: '/admin/users', icon: 'fas fa-users', text: 'Users' },
    { path: '/admin/announcements', icon: 'fas fa-bullhorn', text: 'Announcements' },
    { path: '/admin/faculties', icon: 'fas fa-university', text: 'Faculties' },
    { path: '/admin/settings', icon: 'fas fa-cog', text: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-0 left-0 m-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? (
            <XIcon className="h-6 w-6" />
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        lg:block fixed inset-y-0 left-0 z-40 w-64 transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-2 py-2">
            {/* Breadcrumbs */}
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {getBreadcrumbs().map((item, index) => (
                  <li key={item.href}>
                    <div className="flex items-center">
                      {index > 0 && (
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                        </svg>
                      )}
                      <a
                        href={item.href}
                        className={`ml-4 text-sm font-medium ${
                          item.current
                            ? 'text-orange-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {item.name}
                      </a>
                    </div>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-2 mr-10">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 relative"
                >
                  <BellIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <NotificationModal
                  isOpen={isNotificationModalOpen}
                  onClose={() => setIsNotificationModalOpen(false)}
                  notifications={notifications}
                  onMarkAsRead={handleMarkAsRead}
                />
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 text-sm focus:outline-none"
                >
                  {user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt={user.fullName}
                      className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-orange-600 flex items-center justify-center text-white font-medium ring-2 ring-gray-100">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                  {/* <span className="hidden md:block font-medium text-gray-700">
                    {user?.fullName || 'Admin'}
                  </span> */}
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700">
                        {user?.fullName}
                      </div>
                      <div className="px-4 py-2 text-sm text-gray-500">
                        {user?.email}
                      </div>
                      <hr className="my-1" />
                      <a
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        Sign out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="p-4 md:p-8">
          <div className="max-w-8xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
