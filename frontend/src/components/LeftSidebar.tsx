import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import { User } from '../types';
import { 
  IoSchoolOutline, 
  IoMailOutline, 
  IoCallOutline, 
  IoCalendarOutline, 
  IoLocationOutline, 
  IoBusinessOutline, // Changed from IoBuildingOutline
  IoCheckmarkCircle
} from 'react-icons/io5';

const LeftSidebar: React.FC = () => {
  const [userInfo, setUserInfo] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = await authService.getProfile();
      if (user) {
        setUserInfo(user);
      }
    };
    fetchUserInfo();
  }, []);

  if (!userInfo) {
    return <div className="animate-pulse">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-16 bg-gray-200"></div>
        <div className="p-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto -mt-10"></div>
          <div className="h-4 bg-gray-200 rounded mt-4 mx-auto w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded mt-2 mx-auto w-1/3"></div>
        </div>
      </div>
    </div>;
  }

  return (
    <aside className="hidden md:block col-span-1">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-orange-600 to-orange-500"></div>
        <div className="p-4">
          {/* Avatar section */}
          <div className="relative w-fit mx-auto">
            {userInfo.avatar?.url ? (
              <img
                src={userInfo.avatar.url}
                alt={userInfo.fullName}
                className="w-20 h-20 rounded-full border-4 border-white -mt-10 object-cover shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-4 border-white -mt-10 bg-orange-600 flex items-center justify-center text-white text-2xl font-medium shadow-lg">
                {userInfo.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
            {userInfo.role === 'admin' && (
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5">
                <IoCheckmarkCircle className="text-xl text-blue-500" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="text-center mt-3">
            <h2 className="text-lg font-semibold text-gray-900">{userInfo.fullName}</h2>
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium mt-1">
              {userInfo.role === 'student' ? 'Sinh viên' : userInfo.role === 'admin' ? 'Quản trị viên' : 'Cán bộ'}
            </span>
          </div>

          {/* Detailed Info */}
          <div className="mt-4 space-y-3 text-sm">
            {userInfo.id && (
              <div className="flex items-center gap-2 text-gray-600">
                <IoSchoolOutline className="text-lg text-gray-400" />
                <span>MSSV/MCB: {userInfo.id}</span>
              </div>
            )}
            {userInfo.class && (
              <div className="flex items-center gap-2 text-gray-600">
                <IoBusinessOutline className="text-lg text-gray-400" /> {/* Changed here */}
                <span>Lớp: {userInfo.class}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <IoMailOutline className="text-lg text-gray-400" />
              <span className="truncate">{userInfo.email}</span>
            </div>
            {userInfo.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <IoCallOutline className="text-lg text-gray-400" />
                <span>{userInfo.phone}</span>
              </div>
            )}
            {userInfo.birthday && (
              <div className="flex items-center gap-2 text-gray-600">
                <IoCalendarOutline className="text-lg text-gray-400" />
                <span>{new Date(userInfo.birthday).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Thống kê hoạt động</h3>
            <div className="space-y-2">
              <StatsItem label="Sự kiện đã tham gia" value={userInfo.registeredEvents.length} />
              <StatsItem label="Sự kiện đang theo dõi" value={userInfo.collaboratorEvents.length} />
              <StatsItem label="Điểm hoạt động" value={78} />
              <StatsItem label="Chứng nhận đạt được" value={3} />
            </div>
          </div>

          {/* Quick Actions */}
          {/* <div className="mt-6 pt-4 border-t border-gray-100">
            <button className="w-full bg-orange-600 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-orange-700 transition-colors">
              Xem hồ sơ đầy đủ
            </button>
          </div> */}
        </div>
      </div>
    </aside>
  );
};

const StatsItem = ({ label, value }: { label: string; value: number }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-600">{label}</span>
    <span className="font-semibold text-orange-600">{value}</span>
  </div>
);

export default LeftSidebar;
