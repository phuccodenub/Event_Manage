import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import { IoSchoolOutline, IoPeopleOutline, IoNewspaperOutline, IoTrendingUpOutline, IoCalendarOutline, IoChatbubblesOutline, IoLocationOutline, IoSearchOutline, IoAddOutline } from 'react-icons/io5';
import { FaGraduationCap, FaUserGraduate } from 'react-icons/fa';
import { useCommunityData } from '../hooks/useCommunityData';
import { Link } from 'react-router-dom';

const Community = () => {
  const [selectedTab, setSelectedTab] = useState('groups');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    communityGroups, 
    discussions, 
    upcomingEvents,
    isLoading,
    stats,
    activeMembers
  } = useCommunityData();

  // Filter data based on search query
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    switch (selectedTab) {
      case 'groups':
        return communityGroups.filter(group => 
          group.name.toLowerCase().includes(query) || 
          group.description.toLowerCase().includes(query)
        );
      case 'discussions':
        return discussions.filter(discussion => 
          discussion.title.toLowerCase().includes(query) ||
          discussion.content.toLowerCase().includes(query) ||
          discussion.tags.some(tag => tag.toLowerCase().includes(query))
        );
      case 'events':
        return upcomingEvents.filter(event => 
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query)
        );
      default:
        return [];
    }
  }, [selectedTab, searchQuery, communityGroups, discussions, upcomingEvents]);

  // Show loading state if data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        {/* Hero Section */}
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
      
      {/* Hero Section */}
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

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Navigation Tabs */}
              <div className="space-y-2">
                {[
                  { id: 'groups', label: 'Nhóm', icon: IoPeopleOutline },
                  { id: 'discussions', label: 'Thảo luận', icon: IoChatbubblesOutline },
                  { id: 'events', label: 'Sự kiện', icon: IoCalendarOutline }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                      ${selectedTab === tab.id
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                  >
                    <tab.icon className="text-xl" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                  <IoAddOutline className="text-lg" />
                  <span>Tạo {selectedTab === 'groups' ? 'nhóm mới' : selectedTab === 'discussions' ? 'thảo luận' : 'sự kiện'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Content Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTab === 'groups' ? 'Nhóm cộng đồng' : 
                   selectedTab === 'discussions' ? 'Thảo luận' : 'Sự kiện sắp tới'}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {filteredData.length} kết quả
                  </span>
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="newest">Mới nhất</option>
                    <option value="popular">Phổ biến</option>
                    <option value="trending">Đang hot</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content List */}
            <div className="space-y-6">
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    {selectedTab === 'groups' && (
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-orange-100 flex-shrink-0 overflow-hidden">
                          {item.avatar ? (
                            <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-bold text-2xl">
                              {item.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm text-gray-500 flex items-center">
                              <IoPeopleOutline className="mr-1" />
                              {item.members.toLocaleString()} thành viên
                            </span>
                            <span className="text-sm text-gray-500 flex items-center">
                              <IoNewspaperOutline className="mr-1" />
                              {item.recentActivity}
                            </span>
                          </div>
                        </div>
                        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                          Tham gia
                        </button>
                      </div>
                    )}

                    {selectedTab === 'discussions' && (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex-shrink-0 overflow-hidden">
                          {item.authorAvatar ? (
                            <img src={item.authorAvatar} alt={item.author} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-bold">
                              {item.author.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-600 cursor-pointer">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">Đăng bởi: {item.author}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.tags.map(tag => (
                              <span key={tag} className="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center">
                              <IoChatbubblesOutline className="mr-1" />
                              {item.replies} bình luận
                            </span>
                            <span className="flex items-center">
                              <IoTrendingUpOutline className="mr-1" />
                              {item.views} lượt xem
                            </span>
                            <span className="flex items-center">
                              <IoTimeOutline className="mr-1" />
                              {item.lastActivity}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTab === 'events' && (
                      <div className="space-y-4">
                        <div className="h-48 bg-orange-100 rounded-xl relative overflow-hidden">
                          {item.banner ? (
                            <img src={item.banner} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          )}
                          <div className="absolute bottom-0 left-0 p-6 text-white">
                            <h3 className="text-2xl font-bold">{item.title}</h3>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center">
                                <IoCalendarOutline className="mr-1" />
                                {item.date}
                              </span>
                              <span className="flex items-center">
                                <IoPeopleOutline className="mr-1" />
                                {item.participants} người tham gia
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-gray-600">
                            <p className="flex items-center">
                              <IoCalendarOutline className="mr-2" />
                              {item.time}
                            </p>
                            <p className="flex items-center mt-2">
                              <IoLocationOutline className="mr-2" />
                              {item.location}
                            </p>
                          </div>
                          <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                            Đăng ký
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <IoSearchOutline className="mx-auto text-5xl text-gray-400 mb-4" />
                  <p className="text-gray-500">Không tìm thấy kết quả nào</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Thống kê cộng đồng</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <IoPeopleOutline className="text-3xl text-orange-600 mx-auto" />
                  <div className="mt-2 text-2xl font-bold text-gray-800">
                    {stats?.totalMembers?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Thành viên</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <IoCalendarOutline className="text-3xl text-orange-600 mx-auto" />
                  <div className="mt-2 text-2xl font-bold text-gray-800">
                    {stats?.monthlyEvents || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Sự kiện/tháng</div>
                </div>
              </div>
            </div>

            {/* Active Members */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Thành viên tích cực</h2>
              <div className="space-y-4">
                {activeMembers?.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium overflow-hidden">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-xs text-gray-500">{member.contributions} đóng góp tuần này</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Liên kết nhanh</h2>
              <nav className="space-y-3">
                <Link to="/training" className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <FaGraduationCap className="text-orange-500" />
                  <span>Trang Đào tạo HUTECH</span>
                </Link>
                <Link to="/student-portal" className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <FaUserGraduate className="text-orange-500" />
                  <span>Portal Sinh viên</span>
                </Link>
                <Link to="/library" className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors">
                  <IoSchoolOutline className="text-orange-500" />
                  <span>Thư viện HUTECH</span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
