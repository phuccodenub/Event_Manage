import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IoSearchOutline, IoNotificationsOutline, IoHomeOutline, IoPeopleOutline, IoCalendarOutline } from 'react-icons/io5';
import { IoMdArrowDropdown } from 'react-icons/io';
import { CgProfile } from 'react-icons/cg';
import { IoSettingsOutline, IoLogOutOutline } from 'react-icons/io5';
import authService from '../services/authService';
import NotificationDropdown from './NotificationDropdown';
import ProfileModal from './ProfileModal';
import { User } from '../types';

interface UserData extends User {
  // any additional properties specific to Header
}

const Header: React.FC = () => {
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const navigation = [
    { path: '/', label: 'Trang chủ', icon: IoHomeOutline },
    { path: '/events', label: 'Sự kiện', icon: IoCalendarOutline },
    { path: '/community', label: 'Cộng đồng', icon: IoPeopleOutline },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await authService.getProfile();
        console.log('User data:', user); // Để debug
        if (user) {
          setUserData(user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUserData(null); // Clear user data
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleProfileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false); // Đóng notifications nếu đang mở
  };

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false); // Đóng profile menu nếu đang mở
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const profileButton = document.getElementById('profile-button');
      const profileMenu = document.getElementById('profile-menu');
      const notificationButton = document.getElementById('notification-button');
      const notificationMenu = document.getElementById('notification-menu');

      if (profileButton && profileMenu && notificationButton && notificationMenu) {
        if (!profileButton.contains(target) && !profileMenu.contains(target)) {
          setShowProfileMenu(false);
        }
        if (!notificationButton.contains(target) && !notificationMenu.contains(target)) {
          setShowNotifications(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <img
            src="https://media.loveitopcdn.com/3807/logo-hutech-2.png"
            alt="HUTECH Events Logo"
            className="h-8 w-auto"
          />
          <h1 className="text-xl font-bold text-orange-600 hidden sm:block">
            HUTECH Events
          </h1>
        </div>

        {/* Search Bar */}
        <div className="hidden md:block flex-grow max-w-xl mx-4">
          <div className="relative flex items-center">
            <IoSearchOutline className="absolute left-3 text-gray-400 text-xl pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
              className="w-full pl-10 pr-4 h-10 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-3 rounded-lg flex flex-col items-center transition-colors
                ${location.pathname === item.path 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
                }`}
            >
              <item.icon className="text-xl" />
              <span className="text-xs mt-0.5">{item.label}</span>
            </Link>
          ))}

          {/* Notification Button */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button 
              id="notification-button"
              className={`p-3 rounded-lg flex flex-col items-center transition-colors relative
                ${showNotifications 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-orange-600'
                }`}
              onClick={toggleNotifications}
            >
              <div className="relative">
                <IoNotificationsOutline className="text-xl" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </div>
              <span className="text-xs mt-0.5">Thông báo</span>
            </button>

            <div id="notification-menu">
              <NotificationDropdown 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)}
              />
            </div>
          </div>

          {/* User Profile Button and Modal */}
          <div className="flex items-center ml-2 relative">
            <button 
              id="profile-button"
              className="relative"
              onClick={toggleProfileMenu}
            >
              {/* Profile Picture */}
              <div className="w-10 h-10 rounded-full bg-gray-200 ring-2 ring-gray-200 flex items-center justify-center overflow-hidden">
                {userData && userData.avatar && userData.avatar.url ? (
                  <img 
                    src={userData.avatar.url}
                    alt={userData.fullName || ''}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/default-avatar.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-medium">
                    {userData?.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              {/* Dropdown Button - Positioned absolute to overlay on avatar */}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center ${showProfileMenu ? 'bg-gray-300' : ''}`}>
                <IoMdArrowDropdown 
                  className={`text-base text-gray-600 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}
                />
              </div>
            </button>

            {/* Profile Modal */}
            {userData && (
              <ProfileModal 
                isOpen={showProfileMenu}
                userData={userData}
                onClose={() => setShowProfileMenu(false)}
                onLogout={handleLogout}
              />
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;