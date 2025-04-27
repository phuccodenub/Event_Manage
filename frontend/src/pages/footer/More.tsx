import React from 'react';
import Header from '../../components/Header';
import { Link } from 'react-router-dom';
import { IoHelpCircleOutline, IoShieldCheckmarkOutline, IoBusinessOutline, 
         IoInformationCircleOutline, IoLogoFacebook, IoLogoInstagram, 
         IoLogoLinkedin, IoArrowForward } from 'react-icons/io5';

const More: React.FC = () => {
  const categories = [
    {
      icon: IoHelpCircleOutline,
      title: "Hỗ trợ & Trợ giúp",
      description: "Hướng dẫn và giải đáp thắc mắc",
      items: [
        { title: "Trung tâm trợ giúp", path: "/help", badge: "Mới" },
        { title: "Hướng dẫn sử dụng", path: "/guide" },
        { title: "FAQs", path: "/faqs" },
        { title: "Liên hệ hỗ trợ", path: "/contact" },
        { title: "Báo cáo sự cố", path: "/report" }
      ]
    },
    {
      icon: IoShieldCheckmarkOutline,
      title: "Chính sách & Điều khoản",
      description: "Quy định và điều khoản sử dụng",
      items: [
        { title: "Điều khoản sử dụng", path: "/terms" },
        { title: "Chính sách bảo mật", path: "/privacy" },
        { title: "Quyền sở hữu trí tuệ", path: "/copyright" },
        { title: "Chính sách cookie", path: "/cookies" },
        { title: "Quy tắc ứng xử", path: "/conduct" }
      ]
    },
    {
      icon: IoInformationCircleOutline,
      title: "Về Event Hutech",
      description: "Tìm hiểu về chúng tôi",
      items: [
        { title: "Giới thiệu", path: "/about" },
        { title: "Blog", path: "/blog", badge: "Hot" },
        { title: "Tuyển dụng", path: "/careers" },
        { title: "Đội ngũ phát triển", path: "/team" },
        { title: "Liên hệ", path: "/contact-us" }
      ]
    },
    {
      icon: IoBusinessOutline,
      title: "Dịch vụ doanh nghiệp",
      description: "Giải pháp cho doanh nghiệp",
      items: [
        { title: "Quảng cáo", path: "/advertising" },
        { title: "Tổ chức sự kiện", path: "/business", badge: "Popular" },
        { title: "Đối tác", path: "/partners" },
        { title: "API Documentation", path: "/api-docs" },
        { title: "Success Stories", path: "/success-stories" }
      ]
    }
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
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Khám phá</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Khám phá thêm</h1>
          <p className="text-xl opacity-90 max-w-2xl">Tất cả thông tin và dịch vụ từ Event Hutech</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto space-y-24">
          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                <div className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                      <category.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category.title}</h2>
                      <p className="text-gray-500 text-sm">{category.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx}>
                        <Link 
                          to={item.path}
                          className="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 transition-colors"
                        >
                          <span className="text-gray-700 group-hover:text-gray-900">{item.title}</span>
                          <div className="flex items-center gap-3">
                            {item.badge && (
                              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded-full">
                                {item.badge}
                              </span>
                            )}
                            <IoArrowForward className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Social Connect Section */}
          <section className="relative overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
            
            <div className="relative px-8 py-16">
              <div className="max-w-3xl mx-auto text-center space-y-6">
                <h2 className="text-3xl font-bold text-orange-600">Kết nối với cộng đồng</h2>
                <p className="text-lg text-orange-600">
                  Theo dõi Event Hutech trên mạng xã hội để không bỏ lỡ những thông tin và sự kiện mới nhất
                </p>
                <div className="flex justify-center gap-4 pt-4">
                  <SocialButton icon={IoLogoFacebook} label="Facebook" color="#1877f2" />
                  <SocialButton icon={IoLogoInstagram} label="Instagram" color="#e4405f" />
                  <SocialButton icon={IoLogoLinkedin} label="LinkedIn" color="#0a66c2" />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const SocialButton = ({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => {
  // Special style for Instagram's gradient
  const instagramStyle = label === "Instagram" ? {
    background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)"
  } : {
    backgroundColor: color
  };

  return (
    <button 
      className="group flex items-center gap-3 px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
      style={instagramStyle}
    >
      <Icon className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
      <span className="font-medium text-white">{label}</span>
    </button>
  );
};

export default More;
