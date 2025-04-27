import React, { useState } from 'react';
import Header from '../components/Header';
import { IoTimeOutline, IoCheckmarkCircleOutline, IoCalendarOutline, IoLocationOutline, IoFilterOutline, 
  IoNotificationsOutline, IoPeopleOutline, IoCheckmarkOutline } from 'react-icons/io5';

const AllNotifications = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedView, setSelectedView] = useState('all');

  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'unread', label: 'Chưa đọc' },
    { id: 'events', label: 'Sự kiện' },
    { id: 'system', label: 'Hệ thống' },
  ];

  const timePeriods = [
    { id: 'all', label: 'Mọi lúc' },
    { id: 'today', label: 'Hôm nay' },
    { id: 'week', label: '7 ngày qua' },
    { id: 'month', label: '30 ngày qua' },
  ];

  const viewTypes = [
    { 
      id: 'recent', 
      label: 'Gần đây', 
      icon: IoTimeOutline,
      description: 'Thông báo trong 7 ngày gần đây'
    },
    { 
      id: 'events', 
      label: 'Sự kiện', 
      icon: IoCalendarOutline,
      description: 'Thông báo về sự kiện sắp diễn ra'
    },
    { 
      id: 'followed', 
      label: 'Đang theo dõi', 
      icon: IoCheckmarkCircleOutline,
      description: 'Thông báo từ người/nhóm bạn theo dõi'
    }
  ];

  const notifications = [
    {
      id: 1,
      type: 'event',
      title: 'Sự kiện sắp diễn ra',
      message: 'Workshop "Kỹ năng mềm trong công việc" sẽ diễn ra trong 2 giờ nữa',
      time: '2 giờ trước',
      isRead: false,
      eventDetails: {
        date: '15/04/2024',
        location: 'Hội trường A',
      }
    },
    // ...more notifications
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Thông báo</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Trung tâm thông báo</h1>
          <p className="text-xl opacity-90 max-w-2xl">Quản lý và theo dõi thông báo của bạn</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="relative -mt-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Bộ lọc thông báo</h3>
                  <div className="space-y-6">
                    {/* Filter Types */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Loại thông báo</label>
                      <div className="space-y-2">
                        {filters.map(filter => (
                          <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors
                              ${selectedFilter === filter.id
                                ? 'bg-orange-50 text-orange-600 border-2 border-orange-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                              }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Period Filter */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">Thời gian</label>
                      <div className="space-y-2">
                        {timePeriods.map(period => (
                          <button
                            key={period.id}
                            onClick={() => setSelectedPeriod(period.id)}
                            className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-left transition-colors
                              ${selectedPeriod === period.id
                                ? 'bg-orange-50 text-orange-600 border-2 border-orange-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                              }`}
                          >
                            {period.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                  <IoCheckmarkOutline className="text-lg" />
                  <span>Đánh dấu tất cả đã đọc</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            {/* View Type Navigation - Updated Design */}
            <div className="relative -mt-8 mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-3 divide-x divide-gray-100">
                  {viewTypes.map((view) => (
                    <button
                      key={view.id}
                      onClick={() => setSelectedView(view.id)}
                      className={`
                        p-4 text-left transition-all duration-200
                        ${selectedView === view.id 
                          ? 'bg-orange-50/80' 
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-lg
                          ${selectedView === view.id 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-gray-100 text-gray-600'
                          }
                        `}>
                          <view.icon className="text-xl" />
                        </div>
                        <div>
                          <div className={`font-medium ${
                            selectedView === view.id ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {view.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{view.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md
                    ${!notification.isRead ? 'bg-orange-50/50' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                      ${getNotificationTypeStyles(notification.type)}
                    `}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="mt-1 text-gray-600">{notification.message}</p>
                      
                      {notification.eventDetails && (
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <IoCalendarOutline className="text-orange-500" />
                            {notification.eventDetails.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <IoLocationOutline className="text-orange-500" />
                            {notification.eventDetails.location}
                          </span>
                        </div>
                      )}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-500">{notification.time}</span>
                        {!notification.isRead && (
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                            Chưa đọc
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getNotificationTypeStyles = (type: string) => {
  switch (type) {
    case 'event':
      return 'bg-orange-100 text-orange-600';
    case 'reminder':
      return 'bg-blue-100 text-blue-600';
    case 'success':
      return 'bg-green-100 text-green-600';
    case 'system':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getNotificationIcon = (type: string) => {
  const iconClass = "text-xl";
  switch (type) {
    case 'event':
      return <IoTimeOutline className={iconClass} />;
    case 'reminder':
      return <IoCalendarOutline className={iconClass} />;
    case 'success':
      return <IoCheckmarkCircleOutline className={iconClass} />;
    case 'system':
      return <IoNotificationsOutline className={iconClass} />;
    default:
      return <IoNotificationsOutline className={iconClass} />;
  }
};

export default AllNotifications;
