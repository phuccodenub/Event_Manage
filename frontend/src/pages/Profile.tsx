import React, { useState, useEffect } from 'react';
import { useRoute, useLocation } from "wouter";
import Header from '../components/Header';
import { IoCamera, IoSchoolOutline, IoMailOutline, IoCallOutline, IoCalendarOutline, 
  IoLocationOutline, IoPencil, IoShieldCheckmark, IoEye, IoArrowBack, IoDocumentTextOutline, IoCheckmarkCircle } from 'react-icons/io5';
import AvatarUploadModal from '../components/modals/AvatarUploadModal';
import ProfileEditModal from '../components/modals/ProfileEditModal';
import userService from '../services/userService';
import { toast } from 'react-toastify';
import { User, Event } from '../types';
import { useAuth } from '../context/AuthContext';
import Certificate from '../components/Certificate';
import certificateService from '../services/certificateService';

// Kiểu dữ liệu cho chứng nhận
interface Certificate {
  eventId: string;
  eventName: string;
  eventDate: string;
  type: 'participant' | 'collaborator';
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
        setUser(userData);
        
        // Kiểm tra quyền sở hữu
        setIsOwner(currentUser?._id === userData._id);
        
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
      
      // Lấy danh sách sự kiện
      const events = await userService.getUserEvents(userId);
      console.log(`Retrieved ${events.length} events for user`);
      
      // Lọc các sự kiện tiềm năng có chứng chỉ (đã kết thúc và đã tham gia)
      const currentDate = new Date();
      const potentialEvents = events.filter((event: Event) => {
        if (!event.endDate) {
          return false;
        }
        
        const endDate = new Date(event.endDate);
        const hasEnded = endDate < currentDate;
        const hasParticipated = event.participants?.includes(userId);
        const hasCollaborated = event.collaborators?.includes(userId);
        
        return hasEnded && (hasParticipated || hasCollaborated);
      });
      
      console.log(`Found ${potentialEvents.length} potential events for certificates`);
      
      // Kiểm tra điều kiện nhận chứng nhận thông qua API
      const eligibilityChecks = await Promise.all(
        potentialEvents.map(async (event: Event) => {
          try {
            // Kiểm tra điều kiện chứng nhận participant
            let participantEligible = false;
            if (event.participants?.includes(userId)) {
              try {
                const participantCheck = await certificateService.verifyCertificateEligibility(
                  event._id, 
                  userId, 
                  'participant'
                );
                participantEligible = participantCheck.data.canGenerateCertificate;
                console.log(`Participant eligibility for ${event.title}:`, participantEligible);
              } catch (err) {
                console.log(`Failed to verify participant eligibility for ${event.title}:`, err);
              }
            }
            
            // Kiểm tra điều kiện chứng nhận collaborator
            let collaboratorEligible = false;
            if (event.collaborators?.includes(userId)) {
              try {
                const collaboratorCheck = await certificateService.verifyCertificateEligibility(
                  event._id, 
                  userId, 
                  'collaborator'
                );
                collaboratorEligible = collaboratorCheck.data.canGenerateCertificate;
                console.log(`Collaborator eligibility for ${event.title}:`, collaboratorEligible);
              } catch (err) {
                console.log(`Failed to verify collaborator eligibility for ${event.title}:`, err);
              }
            }
            
            return {
              event,
              participantEligible,
              collaboratorEligible
            };
          } catch (error) {
            console.log(`Error verifying certificates for event ${event._id}:`, error);
            return { event, participantEligible: false, collaboratorEligible: false };
          }
        })
      );
      
      // Chuyển đổi kết quả thành danh sách chứng nhận
      const certificates: Certificate[] = [];
      
      eligibilityChecks.forEach(check => {
        if (check.participantEligible) {
          certificates.push({
            eventId: check.event._id,
            eventName: check.event.title,
            eventDate: check.event.startDate,
            type: 'participant'
          });
        }
        
        if (check.collaboratorEligible) {
          certificates.push({
            eventId: check.event._id,
            eventName: check.event.title,
            eventDate: check.event.startDate,
            type: 'collaborator'
          });
        }
      });
      
      console.log(`Final eligible certificates: ${certificates.length}`);
      setUserCertificates(certificates);
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
    setLocation('/events');
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
      <div className="text-center">Loading profile...</div>
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
          <div className="bg-white rounded-xl shadow-lg mb-6 relative z-20">
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
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information Card */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Thông tin cơ bản</h2>
                      {(isOwner || currentUser?.role === 'admin') && (
                        <button 
                          onClick={handleEditProfile}
                          className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          <IoPencil size={14} />
                          Chỉnh sửa
                        </button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <InfoField
                        icon={IoSchoolOutline}
                        label="MSSV"
                        value={user?.userId || 'Chưa cập nhật'}
                      />
                      <InfoField
                        icon={IoMailOutline}
                        label="Email"
                        value={user?.email || 'Chưa cập nhật'}
                      />
                      <InfoField
                        icon={IoCallOutline}
                        label="Số điện thoại"
                        value={user?.phone || 'Chưa cập nhật'}
                        isPrivate={!isOwner && !!user?.phone}
                      />
                      <InfoField
                        icon={IoCalendarOutline}
                        label="Ngày sinh"
                        value={user?.birthday ? new Date(user.birthday).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        isPrivate={!isOwner && !!user?.birthday}
                      />
                    </div>
                  </div>

                  {/* Education Card */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Học vấn</h2>
                      {(isOwner || currentUser?.role === 'admin') && (
                        <button 
                          onClick={handleEditProfile}
                          className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
                        >
                          <IoPencil size={14} />
                          Chỉnh sửa
                        </button>
                      )}
                    </div>
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
                      <StatItem 
                        label="Sự kiện đã tham gia" 
                        value={user?.uniqueEventCount?.toString() || "0"} 
                        tooltip="Tổng số sự kiện đã tham gia (không trùng lặp)"
                      />
                      <StatItem 
                        label="Đăng ký làm người tham dự" 
                        value={user?.registeredEvents?.length?.toString() || "0"} 
                      />
                      <StatItem 
                        label="Đăng ký làm CTV" 
                        value={user?.collaboratorEvents?.length?.toString() || "0"} 
                      />
                    </div>
                  </div>

                  {/* Permission Note for Viewers */}
                  {!isOwner && (
                    <div className="bg-blue-50 rounded-xl shadow-sm p-4 text-blue-800 text-sm">
                      <div className="flex items-start gap-3">
                        <IoShieldCheckmark className="text-xl text-blue-500 mt-0.5" />
                        <div>
                          <h3 className="font-medium mb-1">Viewing Mode</h3>
                          <p>You are viewing {user?.fullName || 'this user'}'s profile. Some personal information may be hidden and you cannot make changes to this profile.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSection === 'certificates' && (
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Chứng nhận</h2>
                  
                  {loadingCertificates ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
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
  isPrivate = false 
}: { 
  icon: React.ComponentType; 
  label: string; 
  value: string; 
  isPrivate?: boolean; 
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 p-2 rounded-lg bg-orange-50 text-orange-600">
      <Icon />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      {isPrivate ? (
        <p className="font-medium text-gray-400">
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Hidden for privacy</span>
        </p>
      ) : (
        <p className="font-medium text-gray-900">{value}</p>
      )}
    </div>
  </div>
);

// Helper component for statistics
const StatItem = ({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
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

