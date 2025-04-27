import React, { useState } from 'react';
import Header from '../components/Header';
import { IoTimeOutline, IoNotificationsOutline, IoShieldCheckmarkOutline, IoPersonOutline, 
         IoMailOutline, IoPhonePortraitOutline, IoCalendarOutline, IoLanguageOutline } from 'react-icons/io5';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

  const settingTabs = [
    { 
      id: 'account', 
      label: 'Tài khoản', 
      icon: IoPersonOutline,
      description: 'Quản lý thông tin cá nhân',
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
      id: 'notifications', 
      label: 'Thông báo', 
      icon: IoNotificationsOutline,
      description: 'Tùy chỉnh thông báo',
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
          <h1 className="text-5xl font-bold mb-4 leading-tight">Cài đặt tài khoản</h1>
          <p className="text-xl opacity-90 max-w-2xl">Quản lý và tùy chỉnh tài khoản của bạn</p>
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
                {activeTab === 'account' && (
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Thông tin này sẽ được hiển thị công khai
                    </p>
                    <div className="mt-6 space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-xl bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-600">
                            T
                          </div>
                          <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50">
                            <IoPersonOutline className="text-gray-600" />
                          </button>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Ảnh hồ sơ</h3>
                          <p className="text-sm text-gray-500">
                            PNG, JPG hoặc GIF (Tối đa 2MB)
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          icon={IoPersonOutline}
                          label="Họ và tên"
                          type="text"
                          placeholder="Nguyễn Văn A"
                        />
                        <FormField
                          icon={IoMailOutline}
                          label="Email"
                          type="email"
                          placeholder="example@hutech.edu.vn"
                        />
                        <FormField
                          icon={IoPhonePortraitOutline}
                          label="Số điện thoại"
                          type="tel"
                          placeholder="0123456789"
                        />
                        <FormField
                          icon={IoCalendarOutline}
                          label="Ngày sinh"
                          type="date"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                    </p>
                    <form className="space-y-4 max-w mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                        <input
                          type="password"
                          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                        <input
                          type="password"
                          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                        <input
                          type="password"
                          className="mt-1 w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Cập nhật mật khẩu
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900">Cài đặt thông báo</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Quản lý thông báo bạn muốn nhận
                    </p>
                    <div className="space-y-4 mt-6">
                      <NotificationSetting
                        title="Thông báo sự kiện"
                        description="Nhận thông báo về các sự kiện mới và cập nhật"
                      />
                      <NotificationSetting
                        title="Thông báo từ cộng đồng"
                        description="Nhận thông báo về hoạt động trong các nhóm"
                      />
                      <NotificationSetting
                        title="Thông báo hệ thống"
                        description="Nhận thông báo về bảo trì và cập nhật hệ thống"
                      />
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
const FormField = ({ icon: Icon, label, type, placeholder, disabled = false }) => (
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

export default Settings;
