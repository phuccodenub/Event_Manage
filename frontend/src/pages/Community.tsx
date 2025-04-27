import React, { useState } from 'react';
import Header from '../components/Header';
import { IoSchoolOutline, IoPeopleOutline, IoNewspaperOutline, IoTrendingUpOutline, IoCalendarOutline, IoChatbubblesOutline } from 'react-icons/io5';
import { FaGraduationCap, FaUserGraduate } from 'react-icons/fa';

const Community = () => {
  const [selectedTab, setSelectedTab] = useState('groups');

  // Data mẫu cho các nhóm cộng đồng
  const communityGroups = [
    {
      id: 1,
      name: 'Khoa Công nghệ thông tin',
      members: 1200,
      avatar: '/images/it-faculty.jpg',
      description: 'Cộng đồng sinh viên CNTT HUTECH',
      recentActivity: 'Đang thảo luận về Hackathon 2024'
    },
    {
      id: 2,
      name: 'CLB Lập trình HUTECH',
      members: 450,
      avatar: '/images/coding-club.jpg',
      description: 'Nơi giao lưu và học hỏi lập trình',
      recentActivity: 'Workshop React.js sắp diễn ra'
    },
    // ...thêm các nhóm khác
  ];

  // Data mẫu cho các thảo luận
  const discussions = [
    {
      id: 1,
      title: 'Chia sẻ kinh nghiệm thực tập tại FPT Software',
      author: 'Nguyễn Văn A',
      avatar: '/images/user1.jpg',
      tags: ['Thực tập', 'IT', 'Kinh nghiệm'],
      replies: 23,
      views: 156,
      lastActivity: '5 phút trước'
    },
    // ...thêm các thảo luận khác
  ];

  // Data mẫu cho sự kiện sắp diễn ra
  const upcomingEvents = [
    {
      id: 1,
      title: 'Ngày hội việc làm IT HUTECH 2024',
      date: '15/04/2024',
      time: '08:00 AM',
      location: 'Hội trường A',
      participants: 320,
      banner: '/images/job-fair.jpg'
    },
    // ...thêm các sự kiện khác
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section - Updated to match Events.tsx style */}
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

      {/* Main Container */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navigation Tabs */}
            <div className="relative -mt-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-3">
                  {[
                    { id: 'groups', label: 'Nhóm', icon: IoPeopleOutline },
                    { id: 'events', label: 'Sự kiện', icon: IoCalendarOutline },
                    { id: 'discussions', label: 'Thảo luận', icon: IoChatbubblesOutline }
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

            {/* Main Content */}
            <div className="space-y-6">
              {selectedTab === 'groups' && (
                <div className="space-y-6">
                  {communityGroups.map(group => (
                    <div key={group.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0" />
                        <div className="flex-grow">
                          <h3 className="text-xl font-semibold">{group.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{group.description}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <span className="text-sm text-gray-500">
                              <IoPeopleOutline className="inline mr-1" />
                              {group.members} thành viên
                            </span>
                            <span className="text-sm text-gray-500">
                              <IoNewspaperOutline className="inline mr-1" />
                              {group.recentActivity}
                            </span>
                          </div>
                        </div>
                        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
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
                    <div key={discussion.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold hover:text-orange-600 cursor-pointer">
                            {discussion.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {discussion.tags.map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>{discussion.replies} bình luận</span>
                            <span>{discussion.views} lượt xem</span>
                            <span>Cập nhật {discussion.lastActivity}</span>
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
                    <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden group">
                      <div className="h-48 bg-gray-200 relative overflow-hidden">
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
                              <IoSchoolOutline className="mr-2" />
                              {event.location}
                            </p>
                          </div>
                          <button className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors">
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
          <div className="relative -mt-8 space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-4">Thống kê cộng đồng</h2>
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Thành viên tích cực</h2>
              <div className="space-y-4">
                {/* Featured member items would go here */}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Liên kết nhanh</h2>
              <nav className="space-y-2">
                <a href="#" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600">
                  <FaGraduationCap />
                  <span>Trang Đào tạo</span>
                </a>
                <a href="#" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600">
                  <FaUserGraduate />
                  <span>Portal Sinh viên</span>
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
