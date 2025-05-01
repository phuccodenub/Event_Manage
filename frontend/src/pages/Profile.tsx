import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { IoCamera, IoSchoolOutline, IoMailOutline, IoCallOutline, IoCalendarOutline, 
  IoLocationOutline, IoTimeOutline, IoCheckmarkCircle, IoPencil, IoShieldCheckmark } from 'react-icons/io5';
import authService from '../services/authService';
import AvatarUploadModal from '../components/modals/AvatarUploadModal';
import userService from '../services/userService';
import { toast } from 'react-toastify';
import { User } from '../types';

const Profile = () => {
  const [activeSection, setActiveSection] = useState('personal');
  const [userData, setUserData] = useState<User | null>(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const data = await authService.getProfile();
      setUserData(data);
    };
    fetchUserData();
  }, []);

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const updatedUser = await userService.updateAvatar(file);
      setUserData(updatedUser);
      setIsAvatarModalOpen(false);
      toast.success('Avatar updated successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const sections = [
    { id: 'personal', label: 'Thông tin cá nhân' },
    { id: 'activities', label: 'Hoạt động' },
    { id: 'certificates', label: 'Chứng nhận' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Banner */}
      <div className="h-64 bg-gradient-to-r from-orange-600 to-orange-500 relative">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent h-32" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-32 pb-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl shadow-lg mb-6 relative z-20">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-xl border-4 border-white shadow-lg overflow-hidden">
                    {userData?.avatar?.url ? (
                      <img 
                        src={userData.avatar.url} 
                        alt={userData.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-orange-100 flex items-center justify-center text-5xl font-bold text-orange-600">
                        {userData?.fullName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button 
                    className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                    onClick={() => setIsAvatarModalOpen(true)}
                  >
                    <IoCamera className="text-gray-600 text-lg" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-grow text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{userData?.fullName}</h1>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      {userData?.role}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{userData?.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <IoSchoolOutline /> {userData?.class || 'Chưa cập nhật lớp'}
                    </span>
                    <span className="flex items-center gap-1">
                      <IoLocationOutline /> TP. Hồ Chí Minh
                    </span>
                    <span className="flex items-center gap-1">
                      <IoShieldCheckmark className="text-green-500" /> Đã xác thực
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
                    <IoPencil />
                    <span>Chỉnh sửa</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="px-6 border-t border-gray-100">
              <div className="flex space-x-8">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`py-4 relative text-sm font-medium ${
                      activeSection === section.id
                        ? 'text-orange-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {section.label}
                    {activeSection === section.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {activeSection === 'personal' && (
              <>
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information Card */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      <InfoField
                        icon={IoSchoolOutline}
                        label="MSSV"
                        value={userData?.userId || 'Chưa cập nhật'}
                      />
                      <InfoField
                        icon={IoMailOutline}
                        label="Email"
                        value={userData?.email}
                      />
                      <InfoField
                        icon={IoCallOutline}
                        label="Số điện thoại"
                        value={userData?.phone || 'Chưa cập nhật'}
                      />
                      <InfoField
                        icon={IoCalendarOutline}
                        label="Ngày sinh"
                        value={userData?.birthday ? new Date(userData.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                      />
                    </div>
                  </div>

                  {/* Education Card */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Học vấn</h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <IoSchoolOutline className="text-2xl text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">HUTECH University</h3>
                          <p className="text-sm text-gray-500">Công nghệ thông tin • 2021 - Hiện tại</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Thống kê hoạt động</h2>
                    <div className="space-y-4">
                      <StatItem label="Sự kiện tham gia" value="8" />
                      <StatItem label="Thảo luận" value="12" />
                      <StatItem label="Chứng chỉ đạt được" value="3" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'activities' && (
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
                  <div className="space-y-6">
                    {/* Activity Item */}
                    <div className="flex gap-4 pb-6 border-b border-gray-100">
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <IoTimeOutline className="text-2xl text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Tham gia sự kiện "Workshop Công nghệ AI"</h3>
                        <p className="text-sm text-gray-500 mt-1">Ngày 20/04/2024 • 14:00 - 17:00</p>
                        <p className="text-sm text-gray-600 mt-2">
                          Đã tham gia và hoàn thành workshop về ứng dụng AI trong phát triển phần mềm.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'certificates' && (
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Chứng nhận đạt được</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Certificate Item */}
                    <div className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <IoCheckmarkCircle className="text-2xl text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Chứng chỉ TOEIC 650</h3>
                        <p className="text-sm text-gray-500">Cấp ngày: 15/03/2023</p>
                        <p className="text-sm text-gray-600 mt-1">ETS - Educational Testing Service</p>
                      </div>
                    </div>

                    <div className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <IoCheckmarkCircle className="text-2xl text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">AWS Certified Cloud Practitioner</h3>
                        <p className="text-sm text-gray-500">Cấp ngày: 20/04/2023</p>
                        <p className="text-sm text-gray-600 mt-1">Amazon Web Services</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onUpload={handleAvatarUpload}
        isLoading={isUploading}
      />
    </div>
  );
};

const InfoField = ({ icon: Icon, label, value }: any) => (
  <div className="space-y-1">
    <div className="text-sm text-gray-500 flex items-center gap-2">
      <Icon className="text-gray-400" />
      <span>{label}</span>
    </div>
    <p className="text-gray-900 font-medium">{value}</p>
  </div>
);

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600">{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

export default Profile;
