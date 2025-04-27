import React from 'react';
import Header from '../../components/Header';

const Advertising: React.FC = () => {
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
          <h1 className="text-5xl font-bold mb-4 leading-tight">Quảng cáo trên Event Hutech</h1>
          <p className="text-xl opacity-90 max-w-2xl">
          Tiếp cận cộng đồng sinh viên HUTECH hiệu quả
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6">Vì sao chọn Event Hutech?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Tiếp cận đúng đối tượng</h3>
                    <p className="text-gray-600">Kết nối với hơn 30,000 sinh viên HUTECH</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Số liệu thực tế</h3>
                    <p className="text-gray-600">Theo dõi hiệu quả chiến dịch chi tiết</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold mb-6">Các gói quảng cáo</h2>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Gói Basic</h3>
                  <ul className="mt-2 space-y-2 text-gray-600">
                    <li>• Hiển thị banner 7 ngày</li>
                    <li>• Tiếp cận 5,000 sinh viên</li>
                    <li>• Báo cáo cơ bản</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">Gói Premium</h3>
                  <ul className="mt-2 space-y-2 text-gray-600">
                    <li>• Hiển thị banner 30 ngày</li>
                    <li>• Tiếp cận không giới hạn</li>
                    <li>• Báo cáo chi tiết</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Bạn quan tâm đến quảng cáo?</h2>
            <p className="text-gray-600 mb-6">Liên hệ với chúng tôi để được tư vấn chi tiết</p>
            <button className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 transition-colors">
              Liên hệ ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advertising;
