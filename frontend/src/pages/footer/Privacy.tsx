import React, { useState } from 'react';
import Header from '../../components/Header';
import { IoShieldCheckmarkOutline, IoLockClosedOutline, IoDocumentTextOutline, 
         IoInformationCircleOutline, IoPeopleOutline, IoServerOutline } from 'react-icons/io5';

const Privacy: React.FC = () => {
  const [activeTab, setActiveTab] = useState('privacy');

  const tabs = [
    { id: 'privacy', label: 'Chính sách bảo mật', icon: IoShieldCheckmarkOutline },
    { id: 'terms', label: 'Điều khoản sử dụng', icon: IoDocumentTextOutline },
    { id: 'data', label: 'Dữ liệu người dùng', icon: IoServerOutline },
    { id: 'cookies', label: 'Cookies', icon: IoInformationCircleOutline },
    { id: 'security', label: 'Bảo mật', icon: IoLockClosedOutline },
    { id: 'compliance', label: 'Tuân thủ', icon: IoPeopleOutline },
  ];

  const privacyPolicies = [
    {
      icon: IoLockClosedOutline,
      title: "Bảo mật thông tin",
      items: [
        "Mã hóa dữ liệu người dùng theo chuẩn SSL",
        "Xác thực hai lớp cho tài khoản",
        "Kiểm soát quyền truy cập chặt chẽ",
        "Giám sát hoạt động bất thường"
      ]
    },
    {
      icon: IoInformationCircleOutline,
      title: "Thu thập & Sử dụng",
      items: [
        "Thông tin cá nhân cơ bản",
        "Lịch sử tham gia sự kiện",
        "Dữ liệu tương tác trong ứng dụng",
        "Thông tin thiết bị và địa điểm"
      ]
    },
    {
      icon: IoPeopleOutline,
      title: "Chia sẻ thông tin",
      items: [
        "Chỉ chia sẻ khi được sự đồng ý",
        "Bảo vệ dữ liệu khi chia sẻ",
        "Kiểm soát quyền riêng tư",
        "Không bán thông tin cho bên thứ ba"
      ]
    }
  ];

  const cookiesPolicies = [
    {
      title: "Cookies thiết yếu",
      description: "Cần thiết để website hoạt động và cung cấp dịch vụ",
      required: true,
      items: [
        "Xác thực đăng nhập và bảo mật",
        "Ghi nhớ tùy chọn ngôn ngữ",
        "Lưu trữ thông tin phiên",
        "Quản lý trạng thái đăng ký sự kiện",
        "Xử lý thanh toán an toàn",
        "Duy trì trạng thái người dùng"
      ]
    },
    {
      title: "Cookies phân tích",
      description: "Giúp chúng tôi hiểu và cải thiện trải nghiệm người dùng",
      required: false,
      items: [
        "Google Analytics - Phân tích lưu lượng",
        "Hotjar - Theo dõi hành vi người dùng",
        "Facebook Pixel - Đo lường tương tác",
        "Thống kê thời gian truy cập",
        "Phân tích luồng người dùng",
        "Báo cáo hiệu suất trang"
      ]
    },
    {
      title: "Cookies Marketing",
      description: "Được sử dụng để cá nhân hóa trải nghiệm",
      required: false,
      items: [
        "Quảng cáo được cá nhân hóa",
        "Đề xuất sự kiện phù hợp",
        "Retargeting trên các nền tảng",
        "Tối ưu hóa chiến dịch",
        "Theo dõi chuyển đổi",
        "Phân tích hành vi người dùng"
      ]
    },
    {
      title: "Cookies của bên thứ ba",
      description: "Từ các đối tác tích hợp",
      required: false,
      items: [
        "Tích hợp mạng xã hội",
        "Nền tảng thanh toán",
        "Dịch vụ bản đồ",
        "Chatbot hỗ trợ",
        "Đánh giá và phản hồi",
        "Nền tảng streaming"
      ]
    }
  ];

  const securityMeasures = [
    {
      title: "Bảo mật dữ liệu",
      items: [
        "Mã hóa SSL/TLS cho dữ liệu truyền tải",
        "Mã hóa AES-256 cho dữ liệu lưu trữ",
        "Mã hóa end-to-end cho tin nhắn",
        "Bảo vệ thông tin thanh toán theo PCI DSS",
        "Mã hóa mật khẩu với salt ngẫu nhiên",
        "Quản lý khóa bảo mật tự động"
      ]
    },
    {
      title: "Kiểm soát truy cập",
      items: [
        "Xác thực đa yếu tố (2FA/MFA)",
        "Quản lý phiên đăng nhập an toàn",
        "Giới hạn đăng nhập sai",
        "Cơ chế khóa tài khoản tự động",
        "Phân quyền chi tiết theo vai trò",
        "Giám sát hoạt động bất thường"
      ]
    },
    {
      title: "Bảo vệ cơ sở hạ tầng",
      items: [
        "Tường lửa ứng dụng web (WAF)",
        "Hệ thống phát hiện xâm nhập (IDS)",
        "Bảo vệ DDoS theo thời gian thực",
        "Quét lỗ hổng tự động",
        "Backup dữ liệu theo lịch",
        "Khôi phục thảm họa (DR)"
      ]
    },
    {
      title: "Quy trình & Chính sách",
      items: [
        "Đào tạo bảo mật định kỳ",
        "Quy trình phản ứng sự cố",
        "Kiểm tra bảo mật định kỳ",
        "Quản lý rủi ro bảo mật",
        "Chính sách zero-trust",
        "Đánh giá tuân thủ thường xuyên"
      ]
    }
  ];

  const complianceStandards = [
    {
      title: "Quy định pháp luật",
      items: [
        "Luật An ninh mạng Việt Nam",
        "Quy định về bảo vệ dữ liệu",
        "Tuân thủ GDPR cho người dùng EU"
      ]
    },
    {
      title: "Tiêu chuẩn ngành",
      items: [
        "ISO 27001:2013",
        "PCI DSS cho thanh toán",
        "SOC 2 Type II"
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
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Bảo mật</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Quyền riêng tư & Điều khoản</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Cam kết bảo mật và điều khoản sử dụng Event Hutech
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl transition-all whitespace-nowrap
                  ${activeTab === tab.id 
                    ? 'bg-orange-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-orange-50'}`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {activeTab === 'privacy' && (
              <div className="space-y-12">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">Chính sách bảo mật</h2>
                  <p className="text-gray-600">
                    Event Hutech cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng. 
                    Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {privacyPolicies.map((policy, index) => (
                    <div key={index} className="bg-orange-50/50 rounded-xl p-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-4">
                        <policy.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-semibold mb-4">{policy.title}</h3>
                      <ul className="space-y-3">
                        {policy.items.map((item, idx) => (
                          <li key={idx} className="flex items-center text-gray-600">
                            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-8">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">Điều khoản sử dụng</h2>
                  <p className="text-gray-600 mb-8">
                    Bằng việc sử dụng Event Hutech, bạn đồng ý tuân theo các điều khoản và điều kiện sau:
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                    {
                      title: "1. Quy định chung",
                      content: [
                        "Tuân thủ quy định và chính sách của trường Đại học HUTECH",
                        "Không sử dụng nền tảng cho mục đích phi pháp hoặc gian lận",
                        "Tôn trọng quyền sở hữu trí tuệ và bản quyền",
                        "Không chia sẻ tài khoản hoặc mật khẩu cho người khác",
                        "Đảm bảo tính xác thực của thông tin cung cấp",
                        "Không gây hại đến hệ thống hoặc người dùng khác",
                        "Tuân thủ quy tắc ứng xử cộng đồng",
                        "Chịu trách nhiệm về nội dung đăng tải"
                      ]
                    },
                    {
                      title: "2. Tổ chức sự kiện",
                      content: [
                        "Đăng ký và xin phép tổ chức sự kiện theo quy định",
                        "Cung cấp thông tin chính xác và đầy đủ về sự kiện",
                        "Tuân thủ quy định về nội dung và hình ảnh sự kiện",
                        "Đảm bảo an toàn cho người tham gia",
                        "Không thu phí trái phép hoặc lừa đảo",
                        "Tôn trọng quyền riêng tư của người tham gia",
                        "Tuân thủ các quy định về bản quyền",
                        "Chịu trách nhiệm về mọi vấn đề phát sinh"
                      ]
                    },
                    {
                      title: "3. Tham gia sự kiện",
                      content: [
                        "Đăng ký tham gia có trách nhiệm và đúng hạn",
                        "Cung cấp thông tin chính xác khi đăng ký",
                        "Tuân thủ nội quy và hướng dẫn của ban tổ chức",
                        "Tôn trọng quyền và không gian của người khác",
                        "Báo cáo kịp thời các hành vi không phù hợp",
                        "Không gây rối hoặc phá hoại sự kiện",
                        "Bảo mật thông tin của người khác",
                        "Chấp nhận điều khoản hoàn/hủy vé (nếu có)"
                      ]
                    },
                    {
                      title: "4. Nội dung và tương tác",
                      content: [
                        "Không đăng tải nội dung vi phạm pháp luật",
                        "Tôn trọng quyền tác giả và sở hữu trí tuệ",
                        "Không spam hoặc quảng cáo trái phép",
                        "Không đăng tải nội dung phản cảm",
                        "Tôn trọng quan điểm của người khác",
                        "Không kích động chia rẽ hoặc thù hận",
                        "Bảo vệ thông tin cá nhân",
                        "Chịu trách nhiệm về bình luận và đánh giá"
                      ]
                    },
                    {
                      title: "5. Thanh toán và hoàn tiền",
                      content: [
                        "Sử dụng phương thức thanh toán hợp pháp",
                        "Chấp nhận chính sách giá và phí dịch vụ",
                        "Tuân thủ quy định về hoàn tiền và hủy vé",
                        "Không thực hiện giao dịch gian lận",
                        "Bảo mật thông tin thanh toán",
                        "Chấp nhận điều khoản xử lý tranh chấp",
                        "Lưu giữ chứng từ giao dịch",
                        "Thông báo kịp thời các vấn đề phát sinh"
                      ]
                    }
                  ].map((section, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-all">
                      <h3 className="text-xl font-semibold mb-4 text-orange-600">{section.title}</h3>
                      <ul className="space-y-3">
                        {section.content.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-gray-600">
                            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2" />
                            <span className="flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">Dữ liệu người dùng</h2>
                  <p className="text-gray-600 mb-8">
                    Chúng tôi cam kết minh bạch về việc sử dụng dữ liệu người dùng:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    {
                      title: "Thông tin thu thập",
                      items: [
                        "Họ tên và thông tin liên hệ",
                        "Dữ liệu đăng nhập và bảo mật",
                        "Lịch sử tham gia sự kiện",
                        "Tương tác trong ứng dụng"
                      ]
                    },
                    {
                      title: "Mục đích sử dụng",
                      items: [
                        "Cải thiện trải nghiệm người dùng",
                        "Phân tích xu hướng sự kiện",
                        "Nâng cao bảo mật hệ thống",
                        "Hỗ trợ người dùng"
                      ]
                    },
                    {
                      title: "Quyền của người dùng",
                      items: [
                        "Yêu cầu xem dữ liệu cá nhân",
                        "Chỉnh sửa thông tin",
                        "Xóa tài khoản",
                        "Kiểm soát quyền riêng tư"
                      ]
                    },
                    {
                      title: "Bảo vệ dữ liệu",
                      items: [
                        "Mã hóa đầu cuối",
                        "Sao lưu định kỳ",
                        "Kiểm tra bảo mật",
                        "Giám sát truy cập"
                      ]
                    }
                  ].map((section, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                      <ul className="space-y-3">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-center text-gray-600">
                            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cookies' && (
              <div className="space-y-8">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">Chính sách Cookies</h2>
                  <p className="text-gray-600 mb-8">
                    Chúng tôi sử dụng cookies để cải thiện trải nghiệm của bạn trên Event Hutech:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {cookiesPolicies.map((policy, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">{policy.title}</h3>
                        {policy.required && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                            Bắt buộc
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{policy.description}</p>
                      <ul className="space-y-2">
                        {policy.items.map((item, idx) => (
                          <li key={idx} className="flex items-center text-gray-600 text-sm">
                            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">Biện pháp bảo mật</h2>
                  <p className="text-gray-600 mb-8">
                    Chúng tôi áp dụng các biện pháp bảo mật mạnh mẽ để bảo vệ dữ liệu của bạn:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {securityMeasures.map((measure, index) => (
                    <div key={index} className="bg-orange-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold mb-4">{measure.title}</h3>
                      <ul className="space-y-3">
                        {measure.items.map((item, idx) => (
                          <li key={idx} className="flex items-center text-gray-600">
                            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="space-y-8">
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-bold mb-4">Tuân thủ & Chứng nhận</h2>
                  <p className="text-gray-600 mb-8">
                    Event Hutech cam kết tuân thủ các tiêu chuẩn và quy định:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {complianceStandards.map((standard, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-semibold mb-4">{standard.title}</h3>
                      <ul className="space-y-3">
                        {standard.items.map((item, idx) => (
                          <li key={idx} className="flex items-center text-gray-600">
                            <span className="w-1.5 h-1.5 bg-orange-600 rounded-full mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
