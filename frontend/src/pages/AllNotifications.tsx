import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import { IoTimeOutline, IoCheckmarkCircleOutline, IoCalendarOutline, IoLocationOutline, IoFilterOutline, 
  IoNotificationsOutline, IoPeopleOutline, IoCheckmarkOutline, IoNotificationsOffOutline } from 'react-icons/io5';
import { useNotifications } from '../context/NotificationContext'; // Fixed path
import { useNavigate } from 'react-router-dom';

const AllNotifications = () => {
  const { notifications, loading, filterNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const navigate = useNavigate();

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

  const filteredNotifications = useMemo(() => 
    filterNotifications(selectedFilter, selectedPeriod),
    [filterNotifications, selectedFilter, selectedPeriod]
  );

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification._id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

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
                <button
                  onClick={markAllAsRead}
                  className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
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
                      className="p-4 text-left transition-all duration-200 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                          <view.icon className="text-xl" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{view.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{view.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notifications List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 
                      transition-all hover:shadow-md cursor-pointer
                      ${!notification.read ? 'bg-orange-50/50' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600">
                        <IoNotificationsOutline className="text-xl" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="mt-1 text-gray-600">{notification.message}</p>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{notification.createdAt}</span>
                            {notification.link && (
                              <span className="text-orange-600 hover:underline">
                                Xem chi tiết →
                              </span>
                            )}
                          </div>
                          {!notification.read && (
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
            ) : (
              <div className="text-center py-12">
                <IoNotificationsOffOutline className="mx-auto text-5xl text-gray-400 mb-4" />
                <p className="text-gray-500">Không có thông báo nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllNotifications;
