import React, { useState } from 'react';
import Header from '../../components/Header';

const AdChoices: React.FC = () => {
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [adNotifications, setAdNotifications] = useState(true);

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
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Quảng cáo</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Tùy chọn quảng cáo</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Kiểm soát trải nghiệm quảng cáo của bạn trên Event Hutech
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-6">Quản lý tùy chọn quảng cáo</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold">Quảng cáo được cá nhân hóa</h3>
                    <p className="text-sm text-gray-600">Hiển thị quảng cáo dựa trên sở thích của bạn</p>
                  </div>
                  <button
                    onClick={() => setPersonalizedAds(!personalizedAds)}
                    className={`relative inline-flex items-center justify-between h-6 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none
                      ${personalizedAds ? 'bg-orange-600' : 'bg-gray-200'}`}
                  >
                    <span className={`
                      inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                      ${personalizedAds ? 'translate-x-3' : 'translate-x-0'}
                    `} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <h3 className="font-semibold">Thông báo quảng cáo</h3>
                    <p className="text-sm text-gray-600">Nhận thông báo về quảng cáo mới</p>
                  </div>
                  <button
                    onClick={() => setAdNotifications(!adNotifications)}
                    className={`relative inline-flex items-center justify-between h-6 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none
                      ${adNotifications ? 'bg-orange-600' : 'bg-gray-200'}`}
                  >
                    <span className={`
                      inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out
                      ${adNotifications ? 'translate-x-3' : 'translate-x-0'}
                    `} />
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Chính sách quảng cáo</h2>
              <div className="prose max-w-none text-gray-600">
                <p className="mb-4">
                  Event Hutech cam kết mang đến trải nghiệm quảng cáo minh bạch và có kiểm soát:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Không chia sẻ thông tin cá nhân với nhà quảng cáo</li>
                  <li>Cho phép tùy chỉnh loại quảng cáo hiển thị</li>
                  <li>Tuân thủ quy định về bảo vệ dữ liệu người dùng</li>
                  <li>Minh bạch về cách thức hoạt động của quảng cáo</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Câu hỏi thường gặp</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Làm thế nào để tắt quảng cáo được cá nhân hóa?</h3>
                  <p className="text-gray-600">
                    Bạn có thể tắt quảng cáo được cá nhân hóa trong phần Cài đặt &gt; Quyền riêng tư
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Dữ liệu nào được sử dụng cho quảng cáo?</h3>
                  <p className="text-gray-600">
                    Chúng tôi chỉ sử dụng dữ liệu về sở thích và tương tác của bạn trên nền tảng
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdChoices;
