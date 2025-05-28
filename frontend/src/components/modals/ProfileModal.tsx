import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CgProfile } from 'react-icons/cg';
import { IoSettingsOutline, IoLogOutOutline, IoRibbonOutline } from 'react-icons/io5';
import { MdAdminPanelSettings } from 'react-icons/md';
import { User } from '../../types';
import { getSafeAvatarUrl } from '../../utils/avatarUtils';

interface ProfileModalProps {
  isOpen: boolean;
  userData: User;
  onClose: () => void;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  userData,
  onClose,
  onLogout
}) => {
  const navigate = useNavigate();

  if (!isOpen || !userData) return null;

  const handleNavigateToProfile = () => {
    navigate(`/profile/${userData._id}`);
    onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2.5 w-72 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
      {/* Profile Section */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-3">          <div className="w-12 h-12 rounded-full overflow-hidden">
            {getSafeAvatarUrl(userData.avatar) !== '/default-avatar.png' ? (
              <img 
                src={getSafeAvatarUrl(userData.avatar)}
                alt={userData.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-medium">
                {userData.fullName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 truncate">{userData.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{userData.email}</p>
            <div className="flex items-center mt-1 space-x-2">
              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full capitalize">
                {userData.role}
              </span>
              {userData.class && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {userData.class}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={handleNavigateToProfile}
          className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors"
        >
          <CgProfile className="text-gray-600 text-xl" />
          <div className="flex flex-col items-start">
            <span className="text-sm text-gray-700">Hồ sơ của tôi</span>
            <span className="text-xs text-gray-500">Thông tin cá nhân</span>
          </div>
        </button>
        
        <MenuItem 
          to={`/profile/${userData._id}#certificates`}
          icon={IoRibbonOutline}
          title="Chứng nhận"
          subtitle="Chứng nhận đã nhận"
        />
        
        <MenuItem 
          to="/setting"
          icon={IoSettingsOutline}
          title="Cài đặt"
          subtitle="Tài khoản & Bảo mật"
        />
        
        <div className="border-t border-gray-100 my-1" />
        
        {/* Admin Panel - Only show for admin users */}
        {userData.role === 'admin' && (
          <>
            <div className="border-t border-gray-100 my-1" />
            <MenuItem 
              to="/admin"
              icon={MdAdminPanelSettings}
              title="Admin Panel"
              subtitle="Quản lý hệ thống"
            />
          </>
        )}
        
        <div className="border-t border-gray-100 my-1" />
        <button 
          onClick={onLogout}
          className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 text-red-600 transition-colors"
        >
          <IoLogOutOutline className="text-xl" />
          <span className="text-sm">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

// Helper MenuItem component
const MenuItem = ({ 
  to, 
  icon: IconComponent, 
  title, 
  subtitle 
}: { 
  to: string; 
  icon: React.ComponentType<any>; 
  title: string; 
  subtitle: string; 
}) => {
  return (
    <Link to={to} className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors">
      <IconComponent className="text-gray-600 text-xl" />
      <div className="flex flex-col items-start">
        <span className="text-sm text-gray-700">{title}</span>
        <span className="text-xs text-gray-500">{subtitle}</span>      </div>
    </Link>
  );
};

export default ProfileModal;
