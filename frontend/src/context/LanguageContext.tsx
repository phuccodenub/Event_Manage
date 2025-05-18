import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Định nghĩa các bản dịch
const translations = {
  vi: {
    // Navigation
    home: 'Trang chủ',
    events: 'Sự kiện',
    community: 'Cộng đồng',
    certificates: 'Chứng nhận',
    notifications: 'Thông báo',
    profile: 'Hồ sơ',
    settings: 'Cài đặt',
    logout: 'Đăng xuất',
    
    // Events
    eventDetails: 'Chi tiết sự kiện',
    registerEvent: 'Đăng ký tham gia',
    joinEvent: 'Tham gia',
    cancelRegistration: 'Hủy đăng ký',
    upcomingEvents: 'Sự kiện sắp diễn ra',
    pastEvents: 'Sự kiện đã diễn ra',
    allEvents: 'Tất cả sự kiện',
    searchEvents: 'Tìm kiếm sự kiện...',
    
    // Profile
    personalInfo: 'Thông tin cá nhân',
    editProfile: 'Chỉnh sửa hồ sơ',
    changeAvatar: 'Thay đổi ảnh đại diện',
    myEvents: 'Sự kiện của tôi',
    myCertificates: 'Chứng nhận của tôi',
    
    // Settings
    appearance: 'Giao diện',
    language: 'Ngôn ngữ',
    security: 'Bảo mật',
    privacy: 'Quyền riêng tư',
    notificationSettings: 'Cài đặt thông báo',
    accessibility: 'Hỗ trợ tiếp cận',
    changePassword: 'Thay đổi mật khẩu',
    saveChanges: 'Lưu thay đổi',
    currentPassword: 'Mật khẩu hiện tại',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu',
    
    // Theme
    lightMode: 'Chế độ sáng',
    darkMode: 'Chế độ tối',
    
    // Languages
    vietnamese: 'Tiếng Việt',
    english: 'Tiếng Anh',
    
    // Font sizes
    small: 'Nhỏ',
    medium: 'Vừa',
    large: 'Lớn',
    
    // Common actions
    save: 'Lưu',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    upload: 'Tải lên',
    download: 'Tải xuống'
  },
  
  en: {
    // Navigation
    home: 'Home',
    events: 'Events',
    community: 'Community',
    certificates: 'Certificates',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Log out',
    
    // Events
    eventDetails: 'Event Details',
    registerEvent: 'Register',
    joinEvent: 'Join',
    cancelRegistration: 'Cancel Registration',
    upcomingEvents: 'Upcoming Events',
    pastEvents: 'Past Events',
    allEvents: 'All Events',
    searchEvents: 'Search events...',
    
    // Profile
    personalInfo: 'Personal Information',
    editProfile: 'Edit Profile',
    changeAvatar: 'Change Avatar',
    myEvents: 'My Events',
    myCertificates: 'My Certificates',
    
    // Settings
    appearance: 'Appearance',
    language: 'Language',
    security: 'Security',
    privacy: 'Privacy',
    notificationSettings: 'Notification Settings',
    accessibility: 'Accessibility',
    changePassword: 'Change Password',
    saveChanges: 'Save Changes',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    
    // Theme
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    
    // Languages
    vietnamese: 'Vietnamese',
    english: 'English',
    
    // Font sizes
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
    
    // Common actions
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    upload: 'Upload',
    download: 'Download'
  }
};

type Language = 'vi' | 'en';
type TranslationKey = keyof typeof translations.vi;

interface LanguageContextType {
  language: Language;
  translate: (key: TranslationKey) => string;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  translate: () => '',
  setLanguage: () => {},
  toggleLanguage: () => {},
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        return preferences.language as Language || 'vi';
      } catch (_) {
        return 'vi';
      }
    }
    return 'vi';
  });

  useEffect(() => {
    // Cập nhật thuộc tính lang của html
    document.documentElement.lang = language;
    
    // Áp dụng thay đổi ngôn ngữ (ví dụ: có thể thay đổi hướng văn bản cho ngôn ngữ RTL)
    if (language === 'en') {
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-vi');
    } else {
      document.body.classList.add('lang-vi');
      document.body.classList.remove('lang-en');
    }
  }, [language]);

  const translate = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    
    // Lưu ngôn ngữ vào localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    const preferences = savedPreferences ? JSON.parse(savedPreferences) : {};
    preferences.language = newLanguage;
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, translate, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 