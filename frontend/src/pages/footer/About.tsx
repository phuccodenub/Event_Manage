import React from 'react';
import Header from '../../components/Header';

const About: React.FC = () => {
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
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Giới thiệu</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Về Event Hutech</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Nền tảng quản lý sự kiện hàng đầu dành cho sinh viên HUTECH
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto space-y-12">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Sứ mệnh của chúng tôi</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Event Hutech được tạo ra với mục tiêu kết nối và tạo điều kiện cho sinh viên HUTECH 
              tiếp cận với các sự kiện học thuật, văn hóa và hoạt động ngoại khóa một cách dễ dàng 
              và hiệu quả.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-3">Học tập</h3>
              <p className="text-gray-600">
                Tạo môi trường học tập năng động thông qua các sự kiện học thuật đa dạng
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-3">Kết nối</h3>
              <p className="text-gray-600">
                Xây dựng cộng đồng sinh viên gắn kết và hỗ trợ lẫn nhau
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3">Phát triển</h3>
              <p className="text-gray-600">
                Thúc đẩy phát triển toàn diện cho sinh viên HUTECH
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Đội ngũ phát triển</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Team member card */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src="https://res.cloudinary.com/dafs3lklr/image/upload/v1745549055/ChidiImage3_ckcn9b.jpg" 
                    alt="Team Member" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Nguyễn Thành Lộc</h3>
                  <p className="text-orange-600 text-sm font-medium mt-0.5">Developer</p>
                  <p className="text-gray-500 text-sm mt-1">CNTT - HUTECH</p>
                </div>
              </div>

              {/* More team members with the same structure */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src="https://res.cloudinary.com/dafs3lklr/image/upload/v1745549006/NSP_yb6xwt.jpg" 
                    alt="Team Member" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Nguyễn Sỹ Phúc</h3>
                  <p className="text-orange-600 text-sm font-medium mt-0.5">Developer</p>
                  <p className="text-gray-500 text-sm mt-1">CNTT - HUTECH</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="aspect-[4/5] overflow-hidden">
                  <img 
                    src="https://res.cloudinary.com/dafs3lklr/image/upload/v1745568738/TKH_xwsgd8.jpg" 
                    alt="Team Member" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">Trần Kim Hương</h3>
                  <p className="text-orange-600 text-sm font-medium mt-0.5">Developer</p>
                  <p className="text-gray-500 text-sm mt-1">CNTT - HUTECH</p>
                </div>
              </div>
              
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
