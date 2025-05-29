import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  IoSearchOutline, 
  IoNotificationsOutline, 
  IoHomeOutline, 
  IoPeopleOutline, 
  IoCalendarOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoRibbon
} from 'react-icons/io5';
import { IoMdArrowDropdown } from 'react-icons/io';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import NotificationDropdown from './NotificationDropdown';
import ProfileModal from './modals/ProfileModal';
import { useNotifications } from '../context/NotificationContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import { getSafeAvatarUrl } from '../utils/avatarUtils';

const Header: React.FC = () => {
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { fetchNotifications } = useNotifications();
  const { unreadCount, refreshUnreadCount } = useUnreadCount();
  const { user: userData, loading: userLoading } = useAuth();

  // Fetch notifications on initial load
  useEffect(() => {
    if (!userLoading && userData) {
      fetchNotifications();
      refreshUnreadCount();
    }
  }, [fetchNotifications, refreshUnreadCount]);

  const navigation = [
    { path: '/', label: 'Trang chủ', icon: IoHomeOutline },
    { path: '/events', label: 'Sự kiện', icon: IoCalendarOutline },
    { path: '/community', label: 'Cộng đồng', icon: IoPeopleOutline },
    { path: '/certificates', label: 'Chứng nhận', icon: IoRibbon },
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleProfileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false); // Đóng notifications nếu đang mở
    setShowMobileMenu(false); // Đóng mobile menu nếu đang mở
  };

  const toggleNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false); // Đóng profile menu nếu đang mở
    setShowMobileMenu(false); // Đóng mobile menu nếu đang mở
  };

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMobileMenu(!showMobileMenu);
    setShowProfileMenu(false); // Đóng profile menu nếu đang mở
    setShowNotifications(false); // Đóng notifications nếu đang mở
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const profileButton = document.getElementById('profile-button');
      const profileMenu = document.getElementById('profile-menu');
      const notificationButton = document.getElementById('notification-button');
      const notificationMenu = document.getElementById('notification-menu');
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      const mobileMenu = document.getElementById('mobile-menu');

      if (profileButton && profileMenu && notificationButton && notificationMenu) {
        if (!profileButton.contains(target) && !profileMenu.contains(target)) {
          setShowProfileMenu(false);
        }
        if (!notificationButton.contains(target) && !notificationMenu.contains(target)) {
          setShowNotifications(false);
        }
      }

      if (mobileMenuButton && mobileMenu) {
        if (!mobileMenuButton.contains(target) && !mobileMenu.contains(target)) {
          setShowMobileMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  try {
    return (
      <>
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            {/* Logo Section */}
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <img
                src="https://media.loveitopcdn.com/3807/logo-hutech-2.png"
                alt="HUTECH Events Logo"
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-orange-600 hidden sm:block">
                HUTECH Events
              </h1>
            </Link>

            {/* Search Bar - Hidden on Mobile */}
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

            {/* Mobile Menu Button - Visible only on mobile */}
            <button
              id="mobile-menu-button"
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
              onClick={toggleMobileMenu}
            >
              {showMobileMenu ? <IoCloseOutline className="text-2xl" /> : <IoMenuOutline className="text-2xl" />}
            </button>

            {/* Navigation - Hidden on Mobile */}
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
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center notification-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
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
              {!userLoading && userData && (
                <div className="flex items-center ml-2 relative">
                  <button 
                    id="profile-button"
                    className="relative"
                    onClick={toggleProfileMenu}
                  >
                    {/* Profile Picture */}                    <div className="w-10 h-10 rounded-full bg-gray-200 ring-2 ring-gray-200 flex items-center justify-center overflow-hidden">
                      {getSafeAvatarUrl(userData.avatar) !== '/default-avatar.png' ? (
                        <img 
                          src={getSafeAvatarUrl(userData.avatar)}
                          alt={userData.fullName || ''}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-medium">
                          {userData.fullName?.charAt(0)?.toUpperCase() || '?'}
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
                  <ProfileModal 
                    isOpen={showProfileMenu}
                    userData={userData}
                    onClose={() => setShowProfileMenu(false)}
                    onLogout={handleLogout}
                  />
                </div>
              )}
            </nav>
          </div>
          
          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div 
              id="mobile-menu"
              className="md:hidden bg-white border-t border-gray-100 absolute w-full z-50 shadow-lg"
            >
              {/* Mobile Search Bar */}
              <div className="p-4 border-b border-gray-100">
                <div className="relative flex items-center">
                  <IoSearchOutline className="absolute left-3 text-gray-400 text-xl pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sự kiện..."
                    className="w-full pl-10 pr-4 h-10 bg-gray-100 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              {/* Mobile Navigation Links */}
              <nav className="px-2 pt-2 pb-4">
                {navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors
                      ${location.pathname === item.path 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <item.icon className="text-xl mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
                
                {/* Mobile Notification Link */}
                <button
                  onClick={toggleNotifications}
                  className="w-full flex items-center px-4 py-3 mb-1 rounded-lg transition-colors text-left text-gray-700 hover:bg-gray-50"
                >
                  <div className="relative">
                    <IoNotificationsOutline className="text-xl mr-3" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">Thông báo</span>
                </button>
                
                {/* Mobile User Profile */}
                {!userLoading && userData && (
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                    >                      <div className="w-8 h-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center overflow-hidden">
                        {getSafeAvatarUrl(userData.avatar) !== '/default-avatar.png' ? (
                          <img 
                            src={getSafeAvatarUrl(userData.avatar)}
                            alt={userData.fullName || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-medium">
                            {userData.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="font-medium">{userData.fullName || 'Tài khoản'}</span>
                        <p className="text-xs text-gray-500">Xem hồ sơ của bạn</p>
                      </div>
                    </Link>
                    
                    <Link
                      to="/certificates"
                      className="flex items-center px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                    >
                      <span className="w-8 text-center mr-3">
                        <IoRibbon className="text-xl mx-auto" />
                      </span>
                      <span className="font-medium">Chứng nhận</span>
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="flex items-center px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                    >
                      <span className="w-8 text-center mr-3">
                        <i className="fas fa-cog text-xl"></i>
                      </span>
                      <span className="font-medium">Cài đặt</span>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 rounded-lg transition-colors text-left text-red-600 hover:bg-red-50"
                    >
                      <span className="w-8 text-center mr-3">
                        <i className="fas fa-sign-out-alt text-xl"></i>
                      </span>
                      <span className="font-medium">Đăng xuất</span>
                    </button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </header>
        
        {/* Bottom Navigation for Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
          <div className="grid grid-cols-4 h-16">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center transition-colors
                  ${location.pathname === item.path 
                    ? 'text-orange-600' 
                    : 'text-gray-600'
                  }`}
              >
                <item.icon className="text-xl mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
            
            {/* Profile Link for Mobile Bottom Nav */}
            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center transition-colors
                ${location.pathname === '/profile' 
                  ? 'text-orange-600' 
                  : 'text-gray-600'
                }`}
            >
              {!userLoading && userData ? (                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-1">
                  {getSafeAvatarUrl(userData.avatar) !== '/default-avatar.png' ? (
                    <img 
                      src={getSafeAvatarUrl(userData.avatar)}
                      alt={userData.fullName || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-medium text-xs">
                      {userData.fullName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 mb-1"></div>
              )}
              <span className="text-xs">Hồ sơ</span>
            </Link>
          </div>
        </div>
        
        {/* Add padding to main content area to account for bottom nav on mobile */}
        <div className="md:hidden h-16"></div>
      </>
    );
  } catch (error) {
    console.error('Error in Header:', error);
    return null; // hoặc fallback UI
  }
};

export default Header;