import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from "wouter";
import Header from '../components/Header';
import { IoCamera, IoSchoolOutline, IoMailOutline, IoCallOutline, IoCalendarOutline, 
  IoLocationOutline, IoPencil, IoShieldCheckmark, IoEye, IoArrowBack, IoDocumentTextOutline, IoCheckmarkCircle } from 'react-icons/io5';
import { FaFacebook, FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import AvatarUploadModal from '../components/modals/AvatarUploadModal';
import ProfileEditModal from '../components/modals/ProfileEditModal';
import LoadingSpinner from '../components/LoadingSpinner';
import userService from '../services/userService';
import { toast } from 'react-toastify';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import Certificate from '../components/Certificate';
import certificateService from '../services/certificateService';

// Kiểu dữ liệu cho chứng nhận
interface Certificate {
  eventId: string;
  eventName: string;
  eventDate: string;
  type: 'participant' | 'collaborator';
  department?: {
    _id: string;
    name: string;
  };
  category?: string;
}

const Profile = () => {
  const [, params] = useRoute("/profile/:id");
  const [, setLocation] = useLocation();
  const { user: currentUser, refetchUserData } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('personal');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userCertificates, setUserCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [canViewPrivateInfo, setCanViewPrivateInfo] = useState(false);

  // Tải dữ liệu người dùng và chứng chỉ
  useEffect(() => {
    const fetchData = async () => {
      if (!params?.id) {
        setError("User ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Tải thông tin người dùng
        const userData = await userService.getUserById(params.id);
        
        // Kiểm tra và chuyển đổi socialMedia từ chuỗi JSON thành object nếu cần
        if (userData.socialMedia && typeof userData.socialMedia === 'string') {
          try {
            userData.socialMedia = JSON.parse(userData.socialMedia);
          } catch (e) {
            console.error('Error parsing socialMedia JSON:', e);
            userData.socialMedia = { facebook: '', linkedin: '', github: '', instagram: '' };
          }
        }
        
        setUser(userData);
        
        // Kiểm tra quyền sở hữu
        const isProfileOwner = currentUser?._id === userData._id;
        setIsOwner(isProfileOwner);
        
        // Kiểm tra quyền xem thông tin riêng tư
        // Có thể xem nếu là chủ sở hữu, là admin, hoặc người dùng cho phép xem thông tin
        const canViewPrivate = isProfileOwner || 
                              currentUser?.role === 'admin' || 
                              userData.showProfileToOthers !== false;
        setCanViewPrivateInfo(canViewPrivate);
        
        // Tải chứng chỉ nếu user có id hợp lệ
        if (userData && userData._id) {
          await loadCertificates(userData._id);
        }
        
        // Đánh dấu là đã tải xong dữ liệu
        setDataLoaded(true);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setError("Lỗi khi tải dữ liệu người dùng");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [params?.id, currentUser?._id]);

  // Tải danh sách chứng nhận
  const loadCertificates = async (userId: string) => {
    try {
      setLoadingCertificates(true);
      console.log(`Loading certificates for user: ${userId}`);
      
      // Sử dụng API getUserEligibleCertificates để lấy danh sách chứng nhận hợp lệ
      const result = await certificateService.getUserEligibleCertificates(userId);
      console.log('Eligible certificates response:', result);
      
      if (result.success && result.data) {
        // Chuyển đổi định dạng dữ liệu để phù hợp với giao diện hiện tại
        const certificates = result.data.map((cert: {
          eventId: string;
          eventName: string;
          eventDate: string;
          endDate: string;
          department?: { _id: string; name: string };
          category: string;
          certificateType: 'participant' | 'collaborator';
        }) => ({
          eventId: cert.eventId,
          eventName: cert.eventName,
          eventDate: cert.eventDate,
          type: cert.certificateType,
          department: cert.department,
          category: cert.category
        }));
        
        console.log(`Final eligible certificates: ${certificates.length}`);
        setUserCertificates(certificates);
      } else {
        console.log('No certificates or API returned error');
        setUserCertificates([]);
      }
    } catch (error) {
      console.error("Error loading certificates:", error);
      setUserCertificates([]);
      setError("Không thể tải chứng nhận");
    } finally {
      setLoadingCertificates(false);
    }
  };

  // Check for URL hash to set initial activeSection
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const section = hash.replace('#', '');
      if (['personal', 'certificates'].includes(section)) {
        setActiveSection(section);
      }
    }
  }, []);

  const handleAvatarUpload = async (file: File) => {
    if (!isOwner) {
      toast.error('You do not have permission to modify this profile');
      return;
    }
    
    try {
      setLoading(true);
      const updatedUser = await userService.updateAvatar(file);
      setUser(updatedUser);
      setIsAvatarModalOpen(false);
      toast.success('Avatar updated successfully');
      
      // Cập nhật thông tin user trong AuthContext để Header và các component khác cũng được cập nhật
      if (isOwner) {
        await refetchUserData();
        console.log('User data refetched after avatar update');
      }
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update avatar';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (!isOwner && currentUser?.role !== 'admin') {
      toast.error('You do not have permission to modify this profile');
      return;
    }
    
    setIsEditModalOpen(true);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleGoBack = () => {
    setLocation('/');
  };

  // Chỉ chuyển tab, không tải dữ liệu
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const sections = [
    { id: 'personal', label: 'Thông tin cá nhân' },
    { id: 'certificates', label: 'Chứng nhận' }
  ];

  // Hiển thị trạng thái loading
  if (loading && !dataLoaded) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>;
  }

  // Hiển thị lỗi
  if (error) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center text-red-600">{error}</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Banner */}
      <div className="h-64 relative bg-orange-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          {!isOwner && (
            <button 
              onClick={handleGoBack}
              className="flex items-center text-white bg-orange-700 bg-opacity-50 hover:bg-opacity-70 transition-colors py-1 px-3 rounded-lg mb-4"
            >
              <IoArrowBack className="mr-1" /> Back
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-32 pb-8">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl shadow-sm mb-6 relative z-20">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-xl border-4 border-white shadow-lg overflow-hidden">
                    {user?.avatar?.url ? (
                      <img 
                        src={user.avatar.url} 
                        alt={user.fullName || 'User avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-orange-100 flex items-center justify-center text-5xl font-bold text-orange-600">
                        {user?.fullName?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  {isOwner && (
                    <button 
                      className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                      onClick={() => setIsAvatarModalOpen(true)}
                      title="Change avatar"
                    >
                      <IoCamera className="text-gray-600 text-lg" />
                    </button>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-grow text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{user?.fullName || 'User'}</h1>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      {user?.role || 'User'}
                    </span>
                    {!isOwner && currentUser?.role === 'admin' && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        Viewing as Admin
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{user?.email || 'No email available'}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <IoSchoolOutline /> {user?.class || 'Chưa cập nhật lớp'}
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
                  {isOwner ? (
                    <button 
                      onClick={handleEditProfile}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <IoPencil />
                      <span>Chỉnh sửa</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      {currentUser?.role === 'admin' && (
                        <button 
                          onClick={handleEditProfile}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          title="Admin can edit user profiles"
                        >
                          <IoPencil />
                          <span>Admin Edit</span>
                        </button>
                      )}
                      <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2">
                        <IoEye />
                        <span>Viewing</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="px-6 border-t border-gray-100">
              <div className="flex space-x-8">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
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
                {canViewPrivateInfo ? (
                  <>
                    <div className="lg:col-span-2 space-y-6">
                      {/* Basic Information Card */}
                      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
                          <h2 className="text-lg font-semibold text-orange-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Thông tin cơ bản
                          </h2>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100">
                          <div className="grid md:grid-cols-2 gap-6">
                            <InfoField
                              icon={IoSchoolOutline}
                              label="MSSV"
                              value={user?.userId || 'Chưa cập nhật'}
                              highlight={true}
                              isPrivate={false}
                            />
                            <InfoField
                              icon={IoMailOutline}
                              label="Email"
                              value={user?.email || 'Chưa cập nhật'}
                              highlight={true}
                              isPrivate={false}
                            />
                            <InfoField
                              icon={IoCallOutline}
                              label="Số điện thoại"
                              value={user?.phone || 'Chưa cập nhật'}
                              isPrivate={false}
                            />
                            <InfoField
                              icon={IoCalendarOutline}
                              label="Ngày sinh"
                              value={user?.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                              isPrivate={false}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Education Card */}
                      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                          <h2 className="text-lg font-semibold text-orange-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                            </svg>
                            Học vấn
                          </h2>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                            <div className="h-16 w-16 flex-shrink-0 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-center">
                              <img src="/hutech-logo.png" alt="HUTECH" className="h-10 w-10 object-contain" onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-3xl font-bold text-blue-500">H</span>`;
                              }} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">HUTECH University</h3>
                              <p className="text-sm text-gray-500 mt-1">Công nghệ thông tin • 2021 - Hiện tại</p>
                              <div className="flex items-center mt-2">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">Đang theo học</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Social Media Card */}
                      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                          <h2 className="text-lg font-semibold text-orange-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M6 15a3 3 0 100-6 3 3 0 000 6zM14 15a3 3 0 100-6 3 3 0 000 6zM10 8a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M10 3a5 5 0 00-5 5v2a5 5 0 0010 0V8a5 5 0 00-5-5zm-5 7v-2a5 5 0 0110 0v2a5 5 0 01-10 0z" clipRule="evenodd" />
                            </svg>
                            Liên kết mạng xã hội
                          </h2>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100">
                          {(user?.socialMedia?.facebook || user?.socialMedia?.linkedin || 
                            user?.socialMedia?.github || user?.socialMedia?.instagram) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {user?.socialMedia?.facebook && (
                                <a href={user.socialMedia.facebook} target="_blank" rel="noopener noreferrer" 
                                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                  <FaFacebook className="text-blue-600 text-xl mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">Facebook</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{user.socialMedia.facebook}</div>
                                  </div>
                                </a>
                              )}
                              
                              {user?.socialMedia?.linkedin && (
                                <a href={user.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" 
                                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                  <FaLinkedin className="text-blue-700 text-xl mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">LinkedIn</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{user.socialMedia.linkedin}</div>
                                  </div>
                                </a>
                              )}
                              
                              {user?.socialMedia?.github && (
                                <a href={user.socialMedia.github} target="_blank" rel="noopener noreferrer" 
                                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                  <FaGithub className="text-gray-800 text-xl mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">GitHub</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{user.socialMedia.github}</div>
                                  </div>
                                </a>
                              )}
                              
                              {user?.socialMedia?.instagram && (
                                <a href={user.socialMedia.instagram} target="_blank" rel="noopener noreferrer" 
                                  className="flex items-center p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                                  <FaInstagram className="text-pink-600 text-xl mr-3" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-800">Instagram</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[200px]">{user.socialMedia.instagram}</div>
                                  </div>
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500">
                              <p className="mb-2">Chưa có liên kết mạng xã hội nào</p>
                              {isOwner && (
                                <button 
                                  onClick={handleEditProfile}
                                  className="text-sm text-orange-600 hover:text-orange-700"
                                >
                                  + Thêm liên kết
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Thông tin quyền riêng tư cho người xem */}
                      {!isOwner && !canViewPrivateInfo && (
                        <div className="bg-yellow-50 rounded-xl shadow-sm p-5 text-yellow-800 text-sm">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full">
                              <IoEye className="text-xl text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="font-medium mb-1 text-yellow-700">Thông tin bị giới hạn</h3>
                              <p>Người dùng này đã giới hạn quyền xem hồ sơ của họ. Một số thông tin cá nhân đã được ẩn.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Thống kê hoạt động Card */}
                      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                          <h2 className="text-lg font-semibold text-orange-600 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                            </svg>
                            Thống kê hoạt động
                          </h2>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100">
                          <div className="space-y-5">
                            <StatItem 
                              label="Sự kiện đã tham gia" 
                              value={user?.uniqueEventCount?.toString() || "0"} 
                              tooltip="Tổng số sự kiện đã tham gia (không trùng lặp)"
                              icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                              }
                            />
                            <StatItem 
                              label="Đăng ký làm người tham dự" 
                              value={user?.registeredEvents?.length?.toString() || "0"}
                              icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                </svg>
                              }
                            />
                            <StatItem 
                              label="Đăng ký làm CTV" 
                              value={user?.collaboratorEvents?.length?.toString() || "0"}
                              icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Permission Note for Viewers */}
                      {!isOwner && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-5 text-blue-800 text-sm">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <IoShieldCheckmark className="text-xl text-blue-500" />
                            </div>
                            <div>
                              <h3 className="font-medium mb-1 text-blue-700">Chế độ xem</h3>
                              <p>Bạn đang xem hồ sơ của {user?.fullName || 'người dùng này'}. Một số thông tin cá nhân có thể được ẩn và bạn không thể thay đổi hồ sơ này.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="lg:col-span-3 bg-white rounded-xl shadow-sm py-12 px-6 md:px-10">
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                      <div className="mb-6 p-4 bg-gray-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">Thông tin cá nhân được bảo vệ</h2>
                      <p className="text-gray-600 mb-6">Người dùng đã giới hạn quyền xem thông tin cá nhân của họ.</p>
                      <div className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full text-sm mb-4">
                        Không thể xem thông tin chi tiết
                      </div>
                      {!isOwner && (
                        <p className="text-sm text-gray-500 max-w-lg mt-4">
                          Bạn có thể xem hồ sơ đầy đủ của người dùng sau khi họ thay đổi cài đặt quyền riêng tư hoặc cấp quyền cho bạn.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeSection === 'certificates' && (
              <div className="lg:col-span-3">
                {canViewPrivateInfo ? (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Chứng nhận</h2>
                    
                    {loadingCertificates ? (
                      <div className="text-center py-8">
                        <LoadingSpinner size="sm" className="inline-block" />
                        <p className="mt-2 text-gray-500">Đang tải chứng nhận...</p>
                      </div>
                    ) : error && error.includes("chứng nhận") ? (
                      <div className="text-center py-8 text-red-500">
                        <p>{error}</p>
                        <button 
                          onClick={() => user?._id && loadCertificates(user._id)}
                          className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : userCertificates.length > 0 ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userCertificates.map((cert) => (
                            <div 
                              key={`${cert.eventId}-${cert.type}`} 
                              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
                            >
                              <div className="p-4">
                                <h3 className="font-medium text-gray-900 mb-1">{cert.eventName}</h3>
                                <p className="text-sm text-gray-500 mb-3">
                                  Ngày: {new Date(cert.eventDate).toLocaleDateString('vi-VN')}
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                  <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center">
                                    <IoCheckmarkCircle className="mr-1" />
                                    <span>{cert.type === 'participant' ? 'Đã tham gia' : 'Đã cộng tác'}</span>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                  Để tải chứng nhận, vui lòng truy cập trang Chứng nhận
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="flex justify-center mb-4">
                          <IoDocumentTextOutline className="text-5xl text-gray-300" />
                        </div>
                        {isOwner ? 'Bạn chưa có chứng nhận nào' : `${user?.fullName || 'Người dùng này'} chưa có chứng nhận nào`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm py-12 px-6 md:px-10">
                    <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                      <div className="mb-6 p-4 bg-gray-100 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-3">Thông tin chứng nhận được bảo vệ</h2>
                      <p className="text-gray-600 mb-6">Người dùng đã giới hạn quyền xem thông tin chứng nhận của họ.</p>
                      <div className="px-5 py-2 bg-gray-100 text-gray-600 rounded-full text-sm mb-4">
                        Không thể xem danh sách chứng nhận
                      </div>
                      {!isOwner && (
                        <p className="text-sm text-gray-500 max-w-lg mt-4">
                          Bạn có thể xem chứng nhận của người dùng sau khi họ thay đổi cài đặt quyền riêng tư.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {isAvatarModalOpen && (
        <AvatarUploadModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          onUpload={handleAvatarUpload}
          isLoading={loading}
        />
      )}
      
      {/* Profile Edit Modal */}
      {isEditModalOpen && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          userData={user}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

// Helper component for profile information fields
const InfoField = ({ 
  icon: Icon, 
  label, 
  value, 
  isPrivate = false,
  highlight = false
}: { 
  icon: React.ComponentType; 
  label: string; 
  value: string; 
  isPrivate?: boolean;
  highlight?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <div className={`mt-0.5 p-2 rounded-lg ${highlight ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 text-orange-600'}`}>
      <Icon />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      {isPrivate ? (
        <p className="font-medium text-gray-400">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded" title="Thông tin này được bảo vệ bởi cài đặt quyền riêng tư của người dùng">
            Thông tin bị ẩn
          </span>
        </p>
      ) : (
        <p className={`font-medium ${highlight ? 'text-orange-700' : 'text-gray-900'}`}>{value}</p>
      )}
    </div>
  </div>
);

// Helper component for statistics
const StatItem = ({ label, value, tooltip, icon }: { label: string; value: string; tooltip?: string; icon?: React.ReactNode }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
      {icon && (
        <div className="p-2 bg-gray-100 rounded-full">
          {icon}
        </div>
      )}
      <span className="text-sm text-gray-600">{label}</span>
      {tooltip && (
        <span 
          className="text-xs text-gray-400 cursor-help" 
          title={tooltip}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )}
    </div>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

export default Profile;


