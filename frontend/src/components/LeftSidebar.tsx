import React, { useEffect, useState } from 'react';
import authService from '../services/authService';

const LeftSidebar: React.FC = () => {
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const userInfo = authService.getProfile();
    if (userInfo) {
      setUserInfo(userInfo);
    }
  }, []);

  if (!userInfo) {
    return <div>Loading...</div>;
  }

  return (
    <aside className="hidden md:block col-span-1">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-16 bg-green-600"></div>
        <div className="p-4 text-center">
          <img
            src="https://media.loveitopcdn.com/3807/logo-hutech-2.png"
            alt={userInfo.fullName}
            className="w-20 h-20 rounded-full border-4 border-white mx-auto -mt-10"
          />
          <h2 className="mt-4 text-lg font-semibold">{userInfo.fullName}</h2>
          <p className="text-gray-500 text-sm">
            {userInfo.role === 'student' ? `Sinh viên ${userInfo.class} - HUTECH` : 'Cán bộ HUTECH'}
          </p>
          <div className="mt-4 border-t pt-4 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Sự kiện đã tham gia</span>
              <span className="text-blue-600 font-semibold">{userInfo.registeredEvents.length}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Sự kiện quan tâm</span>
              <span className="text-blue-600 font-semibold">{userInfo.collaboratorEvents.length}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Điểm hoạt động</span>
              <span className="text-blue-600 font-semibold">78</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;
