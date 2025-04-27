import React from 'react';
import Header from '../../components/Header';
import { IoLogoGooglePlaystore, IoLogoApple } from 'react-icons/io5';

const Mobile: React.FC = () => {
  const features = [
    {
      icon: "📱",
      title: "Giao diện thân thiện",
      description: "Thiết kế tối giản, dễ sử dụng, tối ưu cho trải nghiệm mobile"
    },
    {
      icon: "🔔",
      title: "Thông báo thông minh",
      description: "Cập nhật tức thì khi có sự kiện mới hoặc thay đổi quan trọng"
    },
    {
      icon: "🎫",
      title: "Quản lý vé QR",
      description: "Lưu trữ và quản lý vé điện tử với mã QR tiện lợi"
    },
    {
      icon: "📍",
      title: "Bản đồ sự kiện",
      description: "Xem vị trí và chỉ đường đến địa điểm tổ chức sự kiện"
    },
    {
      icon: "💬",
      title: "Chat trực tiếp",
      description: "Trao đổi trực tiếp với ban tổ chức và người tham gia"
    },
    {
      icon: "📊",
      title: "Thống kê chi tiết",
      description: "Theo dõi và phân tích các sự kiện bạn đã tham gia"
    }
  ];

  const handleLearnMore = () => {
    // Scroll to Features section smoothly
    document.querySelector('#features')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const handleDownloadApp = () => {
    // Open modal with QR codes for both app stores
    window.open('https://play.google.com/store/apps/eventhutech', '_blank');
  };

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
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Ứng dụng</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Event Hutech Mobile</h1>
          <p className="text-xl opacity-90 max-w-2xl">Trải nghiệm Event Hutech mọi lúc mọi nơi trên điện thoại của bạn</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto space-y-24">
          {/* App Download Section */}
          <section className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-6 text-gray-900">
                  Tải ứng dụng Event Hutech
                </h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Trải nghiệm tất cả tính năng của Event Hutech trong tầm tay. Quản lý sự kiện, nhận thông báo và kết nối với cộng đồng mọi lúc mọi nơi.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="flex items-center gap-3 bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-900 transition-all duration-300">
                    <IoLogoApple className="text-3xl" />
                    <div className="text-left">
                      <div className="text-xs opacity-75">Download on the</div>
                      <div className="text-lg font-semibold">App Store</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-900 transition-all duration-300">
                    <IoLogoGooglePlaystore className="text-3xl" />
                    <div className="text-left">
                      <div className="text-xs opacity-75">GET IT ON</div>
                      <div className="text-lg font-semibold">Google Play</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-orange-200 rounded-full filter blur-3xl opacity-30"></div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-300 rounded-full filter blur-3xl opacity-30"></div>
                <img 
                  src="https://tse2.mm.bing.net/th/id/OIP.V4l95fbIrFIaGA2HPUGhxAHaG_?rs=1&pid=ImgDetMain" 
                  alt="Event Hutech Mobile App"
                  className="relative w-full max-w-md mx-auto drop-shadow-2xl"
                />
              </div>

              
            </div>
          </section>

          {/* Features Grid */}
          <section id="features">
            <h2 className="text-3xl font-bold text-center mb-16">Tính năng nổi bật</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} 
                  className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
                >
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 text-3xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-12 text-white text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-orange-600">Bắt đầu trải nghiệm ngay</h2>
              <p className="text-lg opacity-90 mb-8 text-orange-600">
                Tải xuống ứng dụng Event Hutech và khám phá thế giới sự kiện trong tầm tay bạn
              </p>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={handleLearnMore}
                  className="px-8 py-3 bg-white text-orange-600 rounded-xl ring-1 ring-orange-600 font-medium hover:shadow-lg transition-all"
                >
                  Tìm hiểu thêm
                </button>
                <button 
                  onClick={handleDownloadApp}
                  className="px-8 py-3 bg-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all border border-white/10"
                >
                  Tải ứng dụng
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Mobile;
