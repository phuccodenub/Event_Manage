import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'wouter';
import { 
  IoSchoolOutline, 
  IoMailOutline, 
  IoCallOutline, 
  IoCalendarOutline, 
  IoBusinessOutline,
  IoCheckmarkCircle,
  IoCalendarClearOutline,
  IoPeopleOutline,
  IoBookmarkOutline,
  IoRibbonOutline,
  IoStarOutline
} from 'react-icons/io5';
import { getSafeAvatarUrl } from '../utils/avatarUtils';
import userService from '../services/userService';

// Define event interface from the API response
interface EventResponse {
  _id: string;
  title: string;
  endDate: string;
  participants: string[];
  status: string;
  // Add other specific properties instead of any
  startDate: string;
  description: string;
}

// Define cache keys for LeftSidebar
const LEFT_SIDEBAR_CACHE = {
  USER_DETAILS: 'left_sidebar_user_details_cache',
  CERTIFICATES: 'left_sidebar_certificates_cache',
  LAST_FETCH: 'left_sidebar_last_fetch_time',
  REFRESH_TIMESTAMP: 'last_manual_refresh_timestamp'
};

// Cache expiry time (5 minutes in milliseconds)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

const LeftSidebar: React.FC = () => {
  const { user: authUser, loading } = useAuth();
  const [, navigate] = useLocation();
  const [userInfo, setUserInfo] = useState(authUser);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [certificateCount, setCertificateCount] = useState(0);
  const [isCachedData, setIsCachedData] = useState(false);

  // Check if page was manually refreshed
  const isManualRefresh = () => {
    const now = Date.now();
    const lastRefresh = parseInt(localStorage.getItem('page_load_timestamp') || '0', 10);
    
    // Set the current timestamp
    localStorage.setItem('page_load_timestamp', now.toString());
    
    // If this is the first load or the time difference is small (e.g., within 1 second), 
    // it's likely a manual refresh or initial page load
    return lastRefresh === 0 || (now - lastRefresh) < 1000;
  };

  // Function to check if cache is still valid
  const isCacheValid = (): boolean => {
    // Skip cache if this is a manual refresh
    if (isManualRefresh()) {
      return false;
    }
    
    const lastFetchTime = localStorage.getItem(LEFT_SIDEBAR_CACHE.LAST_FETCH);
    
    if (!lastFetchTime) {
      return false;
    }

    const lastFetch = parseInt(lastFetchTime, 10);
    const now = Date.now();
    
    // Cache is valid if less than CACHE_EXPIRY_TIME has passed
    return now - lastFetch < CACHE_EXPIRY_TIME;
  };

  // Gọi API để lấy thông tin chi tiết của người dùng
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!authUser || !authUser._id) return;

      // Update the last access time
      localStorage.setItem(LEFT_SIDEBAR_CACHE.LAST_FETCH, Date.now().toString());
      
      // Check for manual refresh and skip cache if detected
      const shouldSkipCache = isManualRefresh();
      
      // Try to use cached data if appropriate and not manual refresh
      if (!shouldSkipCache && isCacheValid()) {
        try {
          const cachedUserDetails = localStorage.getItem(LEFT_SIDEBAR_CACHE.USER_DETAILS);
          const cachedCertificates = localStorage.getItem(LEFT_SIDEBAR_CACHE.CERTIFICATES);
          
          if (cachedUserDetails && cachedCertificates) {
            setUserInfo(JSON.parse(cachedUserDetails));
            setCertificateCount(parseInt(cachedCertificates, 10));
            setIsCachedData(true);
            return;
          }
        } catch (error) {
          console.error('Error loading from cache:', error);
          // If there's an error with the cache, proceed to fetch from API
        }
      }

      try {
        setLoadingUserDetails(true);
        const userData = await userService.getUserById(authUser._id);
        setUserInfo(userData);
        
        // Tải danh sách sự kiện để đếm chứng nhận
        if (authUser._id) {
          const events = await userService.getUserEvents(authUser._id);
          
          // Đếm sự kiện đã kết thúc có thể cấp chứng nhận
          const eligibleEvents = events.filter((event: EventResponse) => {
            const eventEndDate = new Date(event.endDate);
            const hasEnded = eventEndDate < new Date();
            const hasParticipated = Array.isArray(event.participants) && 
              authUser._id && event.participants.includes(authUser._id);
            
            return hasEnded && hasParticipated;
          });
          
          setCertificateCount(eligibleEvents.length);
          setIsCachedData(false);
          
          // Save to cache
          try {
            localStorage.setItem(LEFT_SIDEBAR_CACHE.USER_DETAILS, JSON.stringify(userData));
            localStorage.setItem(LEFT_SIDEBAR_CACHE.CERTIFICATES, eligibleEvents.length.toString());
          } catch (cacheError) {
            console.error('Error saving to cache:', cacheError);
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoadingUserDetails(false);
      }
    };

    fetchUserDetails();
  }, [authUser]);

  // Tính điểm hoạt động từ số sự kiện tham gia
  const calculateActivityScore = () => {
    if (!userInfo) return 0;
    
    // Tổng điểm từ các sự kiện
    const uniqueEventPoints = (userInfo.uniqueEventCount || 0) * 5;
    
    // Thêm điểm cho CTV
    const collaboratorPoints = userInfo.collaboratorEvents.length * 3;
    
    return uniqueEventPoints + collaboratorPoints;
  };

  const handleViewProfile = () => {
    if (userInfo?._id) {
      navigate(`/profile/${userInfo._id}`);
    }
  };

  if (loading || loadingUserDetails || !userInfo) {
    return (
      <div className="animate-pulse">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-16 bg-gray-200"></div>
          <div className="p-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto -mt-10"></div>
            <div className="h-4 bg-gray-200 rounded mt-4 mx-auto w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded mt-2 mx-auto w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden md:block col-span-1">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-orange-600 to-orange-500"></div>
        <div className="p-4">
          {/* Avatar section */}          
          <div className="relative w-fit mx-auto">
            {getSafeAvatarUrl(userInfo.avatar) !== '/default-avatar.png' ? (
              <img
                src={getSafeAvatarUrl(userInfo.avatar)}
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
            {userInfo.userId && (
              <div className="flex items-center gap-2 text-gray-600">
                <IoSchoolOutline className="text-lg text-gray-400" />
                <span>MSSV/MCB: {userInfo.userId}</span>
              </div>
            )}
            {userInfo.class && (
              <div className="flex items-center gap-2 text-gray-600">
                <IoBusinessOutline className="text-lg text-gray-400" />
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
              <StatsItem 
                icon={<IoPeopleOutline />}
                label="Sự kiện đã tham gia" 
                value={userInfo.uniqueEventCount || 0} 
                tooltip="Tổng số sự kiện (không trùng lặp)"
              />
              <StatsItem 
                icon={<IoCalendarClearOutline />}
                label="Đăng ký tham dự" 
                value={userInfo.registeredEvents.length} 
              />
              <StatsItem 
                icon={<IoBookmarkOutline />}
                label="Đăng ký CTV" 
                value={userInfo.collaboratorEvents.length} 
              />
            </div>
          </div>

          {/* Achievements Section */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Thành tích</h3>
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-600 p-1.5 rounded-full">
                      <IoStarOutline className="text-lg text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Điểm hoạt động</div>
                      <div className="text-xs text-gray-500">
                        {userInfo.uniqueEventCount || 0} sự kiện • {userInfo.collaboratorEvents.length} CTV
                      </div>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-orange-700">{calculateActivityScore()}</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-1.5 rounded-full">
                      <IoRibbonOutline className="text-lg text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Chứng nhận</div>
                      <div className="text-xs text-gray-500">Hoàn thành sự kiện</div>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-blue-700">{certificateCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <button 
              onClick={handleViewProfile}
              className="w-full bg-orange-600 text-white rounded-lg py-2 px-4 text-sm font-medium hover:bg-orange-700 transition-colors"
            >
              Xem hồ sơ đầy đủ
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const StatsItem = ({ 
  label, 
  value, 
  icon,
  tooltip 
}: { 
  label: string; 
  value: number; 
  icon?: React.ReactNode;
  tooltip?: string;
}) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-2">
      {icon && <span className="text-orange-500">{icon}</span>}
      <span className="text-sm text-gray-600">{label}</span>
      {tooltip && (
        <span 
          className="text-xs text-gray-400 cursor-help"
          title={tooltip}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )}
    </div>
    <span className="font-semibold text-orange-600">{value}</span>
  </div>
);

export default LeftSidebar;
