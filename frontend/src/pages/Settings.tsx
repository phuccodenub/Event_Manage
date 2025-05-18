import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import { toast } from 'react-toastify';
import { 
  IoTimeOutline, IoNotificationsOutline, IoShieldCheckmarkOutline, 
  IoPersonOutline, IoMailOutline, IoPhonePortraitOutline, 
  IoCalendarOutline, IoLanguageOutline, IoGlobeOutline,
  IoColorPaletteOutline, IoAccessibilityOutline, IoKeyOutline,
  IoLockClosedOutline, IoChatbubbleOutline, IoSettingsOutline,
  IoExtensionPuzzleOutline, IoCodeWorkingOutline, IoRocketOutline,
  IoSyncOutline, IoDesktopOutline, IoSaveOutline, IoBrowsersOutline,
  IoMoonOutline, IoEyeOutline, IoCloudDownloadOutline, IoSpeedometerOutline,
  IoHelpCircleOutline, IoBuildOutline
} from 'react-icons/io5';
import { FaFacebook, FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

// Create a CSS style element for dark mode
const createDarkModeStyles = () => {
  const styleElement = document.createElement('style');
  styleElement.id = 'dark-mode-styles';
  styleElement.textContent = `
    body.dark-mode {
      background-color: #1a1a1a !important;
      color: #f5f5f5 !important;
    }
    
    body.dark-mode .bg-white {
      background-color: #2a2a2a !important;
    }
    
    body.dark-mode .bg-gray-50 {
      background-color: #222222 !important;
    }
    
    body.dark-mode .text-gray-900 {
      color: #f5f5f5 !important;
    }
    
    body.dark-mode .text-gray-700 {
      color: #e0e0e0 !important;
    }
    
    body.dark-mode .text-gray-600 {
      color: #cccccc !important;
    }
    
    body.dark-mode .text-gray-500 {
      color: #aaaaaa !important;
    }
    
    body.dark-mode .border-gray-100,
    body.dark-mode .border-gray-200,
    body.dark-mode .border-gray-300 {
      border-color: #3a3a3a !important;
    }
    
    body.dark-mode .bg-gray-50,
    body.dark-mode .bg-gray-100 {
      background-color: #333333 !important;
    }
    
    body.dark-mode .hover\\:bg-gray-50:hover {
      background-color: #3a3a3a !important;
    }
  `;
  return styleElement;
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('appearance');
  const { user, refetchUserData } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    theme: 'light',
    fontSize: 'medium',
    language: 'vi',
    enableEmailNotifications: true,
    enablePushNotifications: true,
    eventReminders: true,
    announcementNotifications: true,
    systemUpdates: true,
    autoplayVideos: false,
    showProfileToOthers: true,
    saveLoginInfo: true,
    highContrastMode: false,
    compactMode: false
  });

  // Inject dark mode styles on component mount
  useEffect(() => {
    let styleElement = document.getElementById('dark-mode-styles');
    if (!styleElement) {
      styleElement = createDarkModeStyles();
      document.head.appendChild(styleElement);
    }

    // Check if we need to apply dark theme on initial load
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      const parsedPrefs = JSON.parse(savedPreferences);
      if (parsedPrefs.theme === 'dark') {
        document.body.classList.add('dark-mode');
      }
    }

    // Cleanup on unmount
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  // Load user preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      setPreferences(prev => ({
        ...prev,
        ...JSON.parse(savedPreferences)
      }));
    }
  }, []);

  // Sync preferences.theme và preferences.language với context
  useEffect(() => {
    setPreferences(prev => ({
      ...prev,
      theme: theme,
      language: language
    }));
  }, [theme, language]);

  // Form field states
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
    facebook: '',
    linkedin: '',
    github: '',
    instagram: ''
  });

  // Update profile data when user data changes
  useEffect(() => {
    if (user) {
      let socialMedia = { facebook: '', linkedin: '', github: '', instagram: '' };
      
      // Parse socialMedia if it exists and is a string
      if (user.socialMedia) {
        try {
          // Handle the case where socialMedia might be a string or an object
          if (typeof user.socialMedia === 'string') {
            socialMedia = JSON.parse(user.socialMedia) as {
              facebook: string;
              linkedin: string;
              github: string;
              instagram: string;
            };
          } else if (typeof user.socialMedia === 'object') {
            socialMedia = {
              facebook: user.socialMedia.facebook || '',
              linkedin: user.socialMedia.linkedin || '',
              github: user.socialMedia.github || '',
              instagram: user.socialMedia.instagram || ''
            };
          }
        } catch (e) {
          console.error('Error parsing socialMedia:', e);
        }
      }
      
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        facebook: socialMedia.facebook || '',
        linkedin: socialMedia.linkedin || '',
        github: socialMedia.github || '',
        instagram: socialMedia.instagram || ''
      });
    }
  }, [user]);

  // Handle profile updates
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('fullName', profileData.fullName);
      formData.append('phone', profileData.phone);
      if (profileData.birthday) {
        formData.append('birthday', profileData.birthday);
      }
      
      // Handle social media as a JSON string to match backend expectations
      const socialMedia = {
        facebook: profileData.facebook,
        linkedin: profileData.linkedin,
        github: profileData.github,
        instagram: profileData.instagram
      };
      
      formData.append('socialMedia', JSON.stringify(socialMedia));
      
      await userService.updateProfile(formData);
      await refetchUserData();
      toast.success('Thông tin cá nhân đã được cập nhật');
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  // Handle password changes
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setLoading(true);
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast.success('Mật khẩu đã được thay đổi thành công');
    } catch (error: any) {
      toast.error(error.message || 'Không thể thay đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUpdatingAvatar(true);
    try {
      await userService.updateAvatar(file);
      await refetchUserData();
      toast.success('Ảnh đại diện đã được cập nhật');
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật ảnh đại diện');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  // Handle avatar removal
  const handleDeleteAvatar = async () => {
    setUpdatingAvatar(true);
    try {
      await userService.deleteAvatar();
      await refetchUserData();
      toast.success('Ảnh đại diện đã được xóa');
    } catch (error: any) {
      toast.error(error.message || 'Không thể xóa ảnh đại diện');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  // Save preferences to localStorage
  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    toast.success('Đã lưu cài đặt của bạn');
    
    // Apply theme changes using ThemeContext
    setTheme(preferences.theme);
    
    // Apply language changes using LanguageContext
    setLanguage(preferences.language as 'vi' | 'en');
    
    // Set font size
    document.documentElement.style.fontSize = 
      preferences.fontSize === 'small' ? '14px' : 
      preferences.fontSize === 'large' ? '18px' : '16px';
  };

  // Handle toggle changes
  const handleToggleChange = (key: string) => {
    setPreferences(prev => {
      const updated = { ...prev, [key]: !prev[key as keyof typeof prev] };
      localStorage.setItem('userPreferences', JSON.stringify(updated));
      return updated;
    });
  };

  const settingTabs = [
    { 
      id: 'appearance', 
      label: 'Giao diện', 
      icon: IoColorPaletteOutline,
      description: 'Tùy chỉnh giao diện người dùng',
      color: 'text-orange-600 bg-orange-50' 
    },
    { 
      id: 'notifications', 
      label: 'Thông báo', 
      icon: IoNotificationsOutline,
      description: 'Tùy chỉnh thông báo',
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      id: 'security', 
      label: 'Bảo mật', 
      icon: IoShieldCheckmarkOutline,
      description: 'Cài đặt bảo mật tài khoản',
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      id: 'privacy', 
      label: 'Quyền riêng tư', 
      icon: IoLockClosedOutline,
      description: 'Kiểm soát dữ liệu cá nhân',
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      id: 'profile', 
      label: 'Hồ sơ', 
      icon: IoPersonOutline,
      description: 'Thông tin của bạn',
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      id: 'accessibility', 
      label: 'Hỗ trợ tiếp cận', 
      icon: IoAccessibilityOutline,
      description: 'Tùy chọn hỗ trợ người dùng',
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      id: 'performance', 
      label: 'Hiệu suất', 
      icon: IoSpeedometerOutline,
      description: 'Tối ưu hóa hiệu suất',
      color: 'text-orange-600 bg-orange-50'
    },
    { 
      id: 'advanced', 
      label: 'Nâng cao', 
      icon: IoBuildOutline,
      description: 'Tùy chỉnh nâng cao',
      color: 'text-orange-600 bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section - Match style with other pages */}
      <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Cài đặt</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Cài đặt hệ thống</h1>
          <p className="text-xl opacity-90 max-w-2xl">Tùy chỉnh hệ thống theo sở thích của bạn</p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-9xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative -mt-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2 sticky top-24">
                {settingTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all
                      ${activeTab === tab.id 
                        ? 'bg-orange-50 border-2 border-orange-100' 
                        : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        activeTab === tab.id 
                          ? 'bg-orange-100 text-orange-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <tab.icon className="text-xl" />
                      </div>
                      <div>
                        <div className={`font-medium ${
                          activeTab === tab.id ? 'text-orange-600' : 'text-gray-900'
                        }`}>{tab.label}</div>
                        <div className="text-sm text-gray-500">{tab.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {/* Giao diện (Appearance) Tab */}
                {activeTab === 'appearance' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Tùy chỉnh giao diện</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Tùy chỉnh cách hiển thị của hệ thống
                    </p>
                    
                    <div className="mt-6 space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">Chủ đề</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <ThemeOption 
                            id="light"
                            label="Sáng"
                            icon={IoDesktopOutline}
                            isSelected={preferences.theme === 'light'}
                            onClick={() => {
                              setPreferences({...preferences, theme: 'light'});
                              setTheme('light');
                            }}
                          />
                          <ThemeOption 
                            id="dark"
                            label="Tối"
                            icon={IoMoonOutline}
                            isSelected={preferences.theme === 'dark'}
                            onClick={() => {
                              setPreferences({...preferences, theme: 'dark'});
                              setTheme('dark');
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">Cỡ chữ</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <SizeOption 
                            id="small"
                            label="Nhỏ"
                            isSelected={preferences.fontSize === 'small'}
                            onClick={() => setPreferences({...preferences, fontSize: 'small'})}
                          />
                          <SizeOption 
                            id="medium"
                            label="Vừa"
                            isSelected={preferences.fontSize === 'medium'}
                            onClick={() => setPreferences({...preferences, fontSize: 'medium'})}
                          />
                          <SizeOption 
                            id="large"
                            label="Lớn"
                            isSelected={preferences.fontSize === 'large'}
                            onClick={() => setPreferences({...preferences, fontSize: 'large'})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">Ngôn ngữ</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <LanguageOption 
                            id="vi"
                            label="Tiếng Việt"
                            isSelected={preferences.language === 'vi'}
                            onClick={() => {
                              setPreferences({...preferences, language: 'vi'});
                              setLanguage('vi');
                            }}
                          />
                          <LanguageOption 
                            id="en"
                            label="English"
                            isSelected={preferences.language === 'en'}
                            onClick={() => {
                              setPreferences({...preferences, language: 'en'});
                              setLanguage('en');
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">Bố cục</h3>
                        <div>
                          <ToggleSetting
                            title="Chế độ thu gọn"
                            description="Giảm khoảng cách và hiển thị nhiều nội dung hơn"
                            isEnabled={preferences.compactMode}
                            onChange={() => handleToggleChange('compactMode')}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={savePreferences}
                          className="flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <IoSaveOutline className="mr-2" />
                          Lưu thiết lập
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Tùy chỉnh thông báo</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Kiểm soát thông báo bạn muốn nhận
                    </p>
                    
                    <div className="mt-6 space-y-4">
                      <h3 className="text-md font-medium text-gray-900">Phương thức nhận thông báo</h3>
                      <div className="space-y-3">
                        <ToggleSetting
                          title="Thông báo qua email"
                          description="Nhận thông báo qua email đã đăng ký"
                          isEnabled={preferences.enableEmailNotifications}
                          onChange={() => handleToggleChange('enableEmailNotifications')}
                        />
                        <ToggleSetting
                          title="Thông báo đẩy"
                          description="Nhận thông báo trên trình duyệt"
                          isEnabled={preferences.enablePushNotifications}
                          onChange={() => handleToggleChange('enablePushNotifications')}
                        />
                      </div>
                      
                      <h3 className="text-md font-medium text-gray-900 mt-6">Loại thông báo</h3>
                      <div className="space-y-3">
                        <ToggleSetting
                          title="Nhắc nhở sự kiện"
                          description="Nhận thông báo nhắc nhở trước khi sự kiện diễn ra"
                          isEnabled={preferences.eventReminders}
                          onChange={() => handleToggleChange('eventReminders')}
                        />
                        <ToggleSetting
                          title="Thông báo"
                          description="Nhận thông báo khi có thông báo mới được đăng"
                          isEnabled={preferences.announcementNotifications}
                          onChange={() => handleToggleChange('announcementNotifications')}
                        />
                        <ToggleSetting
                          title="Cập nhật hệ thống"
                          description="Nhận thông báo về các thay đổi và bảo trì hệ thống"
                          isEnabled={preferences.systemUpdates}
                          onChange={() => handleToggleChange('systemUpdates')}
                        />
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={savePreferences}
                          className="flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <IoSaveOutline className="mr-2" />
                          Lưu thiết lập
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                    </p>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          required
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <IoSyncOutline className="animate-spin mr-2" />
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              <IoKeyOutline className="mr-2" />
                              Cập nhật mật khẩu
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                    
                    <div className="mt-8">
                      <h2 className="text-lg font-semibold text-gray-900">Xác thực hai yếu tố</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Bảo mật tài khoản với lớp xác thực bổ sung
                      </p>
                      
                      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600">
                          Tính năng này đang được phát triển và sẽ sớm được triển khai.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Quyền riêng tư</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Kiểm soát dữ liệu và thông tin của bạn
                    </p>
                    
                    <div className="mt-6 space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">Tùy chọn dữ liệu</h3>
                        <div className="space-y-3">
                          <ToggleSetting
                            title="Hiển thị hồ sơ cho người khác"
                            description="Cho phép người dùng khác xem thông tin cơ bản của bạn"
                            isEnabled={preferences.showProfileToOthers}
                            onChange={() => handleToggleChange('showProfileToOthers')}
                          />
                          <ToggleSetting
                            title="Lưu thông tin đăng nhập"
                            description="Ghi nhớ đăng nhập trên trình duyệt này"
                            isEnabled={preferences.saveLoginInfo}
                            onChange={() => handleToggleChange('saveLoginInfo')}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-md font-medium text-gray-900">Quản lý dữ liệu</h3>
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-900">Tải xuống dữ liệu của bạn</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            Tải xuống bản sao dữ liệu bạn đã tạo trên hệ thống
                          </p>
                          <button className="mt-3 flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            <IoCloudDownloadOutline className="mr-2" />
                            Yêu cầu dữ liệu
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={savePreferences}
                          className="flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <IoSaveOutline className="mr-2" />
                          Lưu thiết lập
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Cập nhật thông tin cá nhân của bạn
                    </p>
                    
                    <div className="mt-6 grid gap-6">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                            {user?.avatar ? (
                              <img 
                                src={typeof user.avatar === 'string' 
                                  ? user.avatar 
                                  : user.avatar.url || ''}
                                alt={user.fullName || 'Avatar'} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <IoPersonOutline className="text-4xl text-gray-400" />
                            )}
                          </div>
                          <label
                            htmlFor="avatar-upload"
                            className="absolute -bottom-1 -right-1 p-1.5 bg-orange-600 text-white rounded-full cursor-pointer hover:bg-orange-700 transition-colors"
                          >
                            <IoCloudDownloadOutline className="text-sm" />
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                setUpdatingAvatar(true);
                                userService.updateAvatar(file)
                                  .then(() => refetchUserData())
                                  .then(() => toast.success('Ảnh đại diện đã được cập nhật'))
                                  .catch((error) => toast.error(error.message || 'Không thể cập nhật ảnh đại diện'))
                                  .finally(() => setUpdatingAvatar(false));
                              }}
                            />
                          </label>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{user?.fullName}</h3>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => {
                                setUpdatingAvatar(true);
                                userService.deleteAvatar()
                                  .then(() => refetchUserData())
                                  .then(() => toast.success('Ảnh đại diện đã được xóa'))
                                  .catch((error) => toast.error(error.message || 'Không thể xóa ảnh đại diện'))
                                  .finally(() => setUpdatingAvatar(false));
                              }}
                              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Xóa ảnh
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        setLoading(true);
                        
                        const formData = new FormData();
                        formData.append('fullName', profileData.fullName);
                        formData.append('phone', profileData.phone);
                        if (profileData.birthday) {
                          formData.append('birthday', profileData.birthday);
                        }
                        
                        // Handle social media as a JSON string
                        const socialMedia = {
                          facebook: profileData.facebook,
                          linkedin: profileData.linkedin,
                          github: profileData.github,
                          instagram: profileData.instagram
                        };
                        
                        formData.append('socialMedia', JSON.stringify(socialMedia));
                        
                        userService.updateProfile(formData)
                          .then(() => refetchUserData())
                          .then(() => toast.success('Thông tin cá nhân đã được cập nhật'))
                          .catch((error) => toast.error(error.message || 'Không thể cập nhật thông tin'))
                          .finally(() => setLoading(false));
                      }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          icon={IoPersonOutline}
                          label="Họ tên"
                          type="text"
                          placeholder="Nhập họ tên của bạn"
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                        />
                        <FormField
                          icon={IoMailOutline}
                          label="Email"
                          type="email"
                          placeholder="Nhập email của bạn"
                          disabled={true}
                          value={profileData.email}
                        />
                        <FormField
                          icon={IoPhonePortraitOutline}
                          label="Số điện thoại"
                          type="tel"
                          placeholder="Nhập số điện thoại của bạn"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                        <FormField
                          icon={IoCalendarOutline}
                          label="Ngày sinh"
                          type="date"
                          placeholder=""
                          value={profileData.birthday}
                          onChange={(e) => setProfileData({...profileData, birthday: e.target.value})}
                        />
                        
                        <h3 className="text-md font-medium text-gray-900 md:col-span-2 mt-4">Liên kết mạng xã hội</h3>
                        <FormField
                          icon={FaFacebook}
                          label="Facebook"
                          type="url"
                          placeholder="https://facebook.com/username"
                          value={profileData.facebook}
                          onChange={(e) => setProfileData({...profileData, facebook: e.target.value})}
                        />
                        <FormField
                          icon={FaLinkedin}
                          label="LinkedIn"
                          type="url"
                          placeholder="https://linkedin.com/in/username"
                          value={profileData.linkedin}
                          onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                        />
                        <FormField
                          icon={FaGithub}
                          label="GitHub"
                          type="url"
                          placeholder="https://github.com/username"
                          value={profileData.github}
                          onChange={(e) => setProfileData({...profileData, github: e.target.value})}
                        />
                        <FormField
                          icon={FaInstagram}
                          label="Instagram"
                          type="url"
                          placeholder="https://instagram.com/username"
                          value={profileData.instagram}
                          onChange={(e) => setProfileData({...profileData, instagram: e.target.value})}
                        />
                        
                        <div className="md:col-span-2 flex justify-end">
                          <button
                            type="submit"
                            className="flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <IoSyncOutline className="animate-spin mr-2" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <IoSaveOutline className="mr-2" />
                            Lưu thay đổi
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Accessibility Tab */}
                {activeTab === 'accessibility' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Trợ năng</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Tùy chỉnh tính năng trợ năng để cải thiện trải nghiệm người dùng
                    </p>
                    
                    <div className="mt-6 space-y-4">
                      <div className="space-y-3">
                        <ToggleSetting
                          title="Độ tương phản cao"
                          description="Tăng độ tương phản màu sắc để dễ nhìn hơn"
                          isEnabled={preferences.highContrastMode}
                          onChange={() => handleToggleChange('highContrastMode')}
                        />
                        <ToggleSetting
                          title="Tự động phát nội dung video"
                          description="Tự động phát video không cần nhấn nút phát"
                          isEnabled={preferences.autoplayVideos}
                          onChange={() => handleToggleChange('autoplayVideos')}
                        />
                      </div>
                      
                      <div className="flex justify-end pt-4">
                        <button
                          onClick={savePreferences}
                          className="flex items-center px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <IoSaveOutline className="mr-2" />
                          Lưu thiết lập
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'performance' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Hiệu suất</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Tối ưu hóa hiệu suất ứng dụng
                    </p>
                    
                    <div className="mt-6 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">
                        Các tùy chọn hiệu suất đang được phát triển và sẽ sớm được triển khai.
                      </p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'advanced' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Cài đặt nâng cao</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Các tùy chọn nâng cao cho người dùng có kinh nghiệm
                    </p>
                    
                    <div className="mt-6 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-600">
                        Các tùy chọn nâng cao đang được phát triển và sẽ sớm được triển khai.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated FormField component
const FormField = ({ icon: Icon, label, type, placeholder, disabled = false, value, onChange }: { 
  icon: React.ElementType; 
  label: string; 
  type: string; 
  placeholder: string; 
  disabled?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Icon className="text-gray-400 text-lg" />
      </div>
      <input
        type={type}
        className={`w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-200
          ${disabled 
            ? 'bg-gray-50 cursor-not-allowed' 
            : 'focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500'
          } transition-all`}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

// Updated NotificationSetting component
const NotificationSetting = ({ title, description }: { title: string; description: string }) => {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="pr-8">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative inline-flex items-center justify-between h-6 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none
          ${enabled ? 'bg-orange-600' : 'bg-gray-200'}`}
      >
        <span className={`
          inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
          ${enabled ? 'translate-x-3' : 'translate-x-0'}
        `} />
      </button>
    </div>
  );
};

// Theme Option Component
const ThemeOption = ({ id, label, icon: Icon, isSelected, onClick }: { 
  id: string; 
  label: string; 
  icon: React.ElementType;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center p-4 rounded-lg border-2 transition-all ${
      isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <div className={`p-2 rounded-full mr-3 ${
      isSelected ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
    }`}>
      <Icon className="text-xl" />
    </div>
    <span className={`font-medium ${isSelected ? 'text-orange-600' : 'text-gray-700'}`}>
      {label}
    </span>
  </button>
);

// Size Option Component
const SizeOption = ({ id, label, isSelected, onClick }: {
  id: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg border-2 text-center transition-all ${
      isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <span className={`font-medium ${isSelected ? 'text-orange-600' : 'text-gray-700'}`}>
      {label}
    </span>
  </button>
);

// Language Option Component
const LanguageOption = ({ id, label, isSelected, onClick }: {
  id: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg border-2 text-center transition-all ${
      isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
    }`}
  >
    <span className={`font-medium ${isSelected ? 'text-orange-600' : 'text-gray-700'}`}>
      {label}
    </span>
  </button>
);

// Toggle Setting Component
const ToggleSetting = ({ title, description, isEnabled, onChange }: {
  title: string;
  description: string;
  isEnabled: boolean;
  onChange: () => void;
}) => (
  <div className="flex items-center justify-between p-4 border border-gray-100 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="pr-8">
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
    <button
      onClick={onChange}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
        isEnabled ? 'bg-orange-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${
          isEnabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default Settings;
