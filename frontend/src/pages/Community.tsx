import React, { useState } from 'react';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { IoSchoolOutline, IoPeopleOutline, IoNewspaperOutline, IoTrendingUpOutline, IoCalendarOutline, IoChatbubblesOutline, IoLocationOutline } from 'react-icons/io5';
import { FaGraduationCap, FaUserGraduate } from 'react-icons/fa';
import { useCommunityData } from '../hooks/useCommunityData';

const Community = () => {
  const [selectedTab, setSelectedTab] = useState('groups');
  
  // Use our React Query hook to fetch and cache data
  const { 
    communityGroups, 
    discussions, 
    upcomingEvents,
    isLoading
  } = useCommunityData();

  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Hero Section - Consistent with Events.tsx style */}
        <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
          <div className="container mx-auto px-4 relative">
            <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Cộng đồng</span>
            <h1 className="text-5xl font-bold mb-4 leading-tight">Cộng đồng HUTECH</h1>
            <p className="text-xl opacity-90 max-w-2xl">Kết nối - Chia sẻ - Phát triển</p>
          </div>
        </div>

        {/* Loading Placeholder */}
        <div className="container mx-auto px-4 py-10">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="h-60 bg-gray-200 rounded"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
              <div className="h-60 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section - Consistent with Events.tsx style */}
      <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Cộng đồng</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Cộng đồng HUTECH</h1>
          <p className="text-xl opacity-90 max-w-2xl">Kết nối - Chia sẻ - Phát triển</p>
        </div>
      </div>

      {/* Navigation Tabs - Positioned to overlap with Hero */}
      <div className="container mx-auto px-4 -mt-8 mb-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-3">
            {[
              { id: 'groups', label: 'Nhóm', icon: IoPeopleOutline },
              { id: 'discussions', label: 'Thảo luận', icon: IoChatbubblesOutline },
              { id: 'events', label: 'Sự kiện', icon: IoCalendarOutline }
            ].map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  flex items-center justify-center space-x-2 py-4 px-2
                  relative transition-all duration-200
                  ${idx !== 2 ? 'border-r border-gray-100' : ''}
                  ${selectedTab === tab.id 
                    ? 'text-orange-600 bg-orange-50/80' 
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }
                `}
              >
                <tab.icon className="text-xl" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <LeftSidebar />
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Content */}
            <div className="space-y-6">
              {selectedTab === 'groups' && (
                <div className="space-y-6">
                  {communityGroups.map(group => (
                    <div key={group.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-lg bg-orange-100 flex-shrink-0 overflow-hidden">
                          {/* Group avatar would go here */}
                          <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-bold">
                            {group.name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{group.description}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <span className="text-sm text-gray-500 flex items-center">
                              <IoPeopleOutline className="mr-1" />
                              {group.members.toLocaleString()} thành viên
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <IoNewspaperOutline className="mr-1" />
                              {group.recentActivity}
                            </span>
                          </div>
                        </div>
                        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                          Tham gia
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'discussions' && (
                <div className="space-y-6">
                  {discussions.map(discussion => (
                    <div key={discussion.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0 overflow-hidden">
                          {/* User avatar would go here */}
                          <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-bold">
                            {discussion.author.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-600 cursor-pointer">
                            {discussion.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Đăng bởi: {discussion.author}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {discussion.tags.map(tag => (
                              <span key={tag} className="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center">
                              <IoChatbubblesOutline className="mr-1" />
                              {discussion.replies} bình luận
                            </span>
                            <span className="flex items-center">
                              <IoTrendingUpOutline className="mr-1" />
                              {discussion.views} lượt xem
                            </span>
                            <span className="flex items-center">
                              <IoCalendarOutline className="mr-1" />
                              {discussion.lastActivity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === 'events' && (
                <div className="space-y-6">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
                      <div className="h-48 bg-orange-100 relative overflow-hidden">
                        {/* Event banner image would go here */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 p-6 text-white">
                          <h3 className="text-2xl font-bold">{event.title}</h3>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="flex items-center">
                              <IoCalendarOutline className="mr-1" />
                              {event.date}
                            </span>
                            <span className="flex items-center">
                              <IoPeopleOutline className="mr-1" />
                              {event.participants} người tham gia
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-center">
                          <div className="text-gray-600">
                            <p className="flex items-center">
                              <IoCalendarOutline className="mr-2" />
                              {event.time}
                            </p>
                            <p className="flex items-center mt-2">
                              <IoLocationOutline className="mr-2" />
                              {event.location}
                            </p>
                          </div>
                          <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                            Đăng ký
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Thống kê cộng đồng</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <IoPeopleOutline className="text-3xl text-orange-600 mx-auto" />
                  <div className="mt-2 text-2xl font-bold text-gray-800">2,500+</div>
                  <div className="text-sm text-gray-600">Thành viên</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <IoCalendarOutline className="text-3xl text-orange-600 mx-auto" />
                  <div className="mt-2 text-2xl font-bold text-gray-800">50+</div>
                  <div className="text-sm text-gray-600">Sự kiện/tháng</div>
                </div>
              </div>
            </div>

            {/* Featured Members */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Thành viên tích cực</h2>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
                      {String.fromCharCode(64 + i)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Người dùng {i}</div>
                      <div className="text-xs text-gray-500">{10 - i} đóng góp tuần này</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Liên kết nhanh</h2>
              <nav className="space-y-3">
                <a href="#" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <FaGraduationCap className="text-orange-500" />
                  <span>Trang Đào tạo HUTECH</span>
                </a>
                <a href="#" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <FaUserGraduate className="text-orange-500" />
                  <span>Portal Sinh viên</span>
                </a>
                <a href="#" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <IoSchoolOutline className="text-orange-500" />
                  <span>Thư viện HUTECH</span>
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
