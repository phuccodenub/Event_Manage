import React, { useState } from 'react';
import Header from '../../components/Header';
import HelpContactModal from '../../components/HelpContactModal';
import { IoSearchOutline, IoHelpCircleOutline, IoLockClosedOutline, IoNotificationsOutline, 
         IoCalendarOutline, IoPersonOutline, IoBusinessOutline, IoChatbubbleEllipsesOutline } from 'react-icons/io5';

const Help: React.FC = () => {
  const [showContactModal, setShowContactModal] = useState(false);

  const helpCategories = [
    {
      icon: IoPersonOutline,
      title: "Tài khoản & Bảo mật",
      items: ["Quản lý tài khoản", "Đổi mật khẩu", "Bảo mật hai lớp"]
    },
    {
      icon: IoCalendarOutline,
      title: "Sự kiện",
      items: ["Tạo sự kiện", "Đăng ký tham gia", "Quản lý sự kiện"]
    },
    {
      icon: IoNotificationsOutline,
      title: "Thông báo",
      items: ["Cài đặt thông báo", "Tùy chỉnh thông báo", "Theo dõi sự kiện"]
    },
    {
      icon: IoBusinessOutline,
      title: "Doanh nghiệp",
      items: ["Tài khoản doanh nghiệp", "Quảng cáo", "Hợp tác"]
    }
  ];

  const popularQuestions = [
    "Làm thế nào để tạo sự kiện mới?",
    "Cách đăng ký tham gia sự kiện?",
    "Quên mật khẩu phải làm sao?",
    "Làm sao để nhận thông báo sự kiện?",
    "Cách liên hệ với ban tổ chức?"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Trợ giúp</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Trung tâm trợ giúp</h1>
          <p className="text-xl opacity-90 max-w-2xl">Giải đáp mọi thắc mắc của bạn</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Search Section - Adjusted to overlap with Hero */}
        <div className="relative -mt-24"> {/* Changed from mb-16 to -mt-24 */}
          <div className="max-w-8xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
                <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/4 text-gray-400 text-xl" />
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Câu hỏi phổ biến:</h3>
                <div className="flex flex-wrap gap-2">
                  {popularQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      className="px-4 py-2 bg-gray-50 hover:bg-orange-50 text-sm text-gray-600 hover:text-orange-600 rounded-lg transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Categories Grid - Adjusted spacing */}
        <div className="max-w-8xl mx-auto mt-12"> {/* Added mt-12 for better spacing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {helpCategories.map((category, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-50 text-orange-600 mb-4">
                  <category.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.title}</h3>
                <ul className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <a href="#" className="text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="max-w-8xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg overflow-hidden">
            <div className="relative px-8 py-10 md:py-12">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }} />
              </div>
              
              {/* Content */}
              <div className="flex items-center gap-8 flex-wrap md:flex-nowrap relative">
                <div className="bg-orange-600/20 backdrop-blur-sm rounded-xl p-4">
                  <IoChatbubbleEllipsesOutline className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-orange-600 mb-2">Vẫn cần hỗ trợ?</h2>
                  <p className="text-orange-600/90">Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7</p>
                </div>
                <div className="w-full md:w-auto">
                  <button 
                    onClick={() => setShowContactModal(true)}
                    className="w-full md:w-auto px-8 py-3 bg-white hover:bg-orange-50 text-orange-600 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <IoChatbubbleEllipsesOutline className="w-5 h-5" />
                    Liên hệ ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        <HelpContactModal 
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />
      </div>
    </div>
  );
};

export default Help;
