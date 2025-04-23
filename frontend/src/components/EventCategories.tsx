import React from 'react';

const EventCategories: React.FC = () => {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-800">Danh mục sự kiện</h2>
        <p className="text-gray-600 mt-2 max-w-xl mx-auto">
          Khám phá các sự kiện đa dạng tại Hutech phù hợp với sở thích và mục tiêu học tập của bạn
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg">
            <div className="text-6xl mx-auto">🎓</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Học thuật</h3>
            <p className="text-gray-600 mt-2">Hội thảo, tọa đàm và các sự kiện học thuật đa ngành</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg">
            <div className="text-6xl mx-auto">🎭</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Văn hóa - Nghệ thuật</h3>
            <p className="text-gray-600 mt-2">Các hoạt động văn hóa, nghệ thuật và giải trí</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg">
            <div className="text-6xl mx-auto">🏆</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Thể thao</h3>
            <p className="text-gray-600 mt-2">Các giải đấu và hoạt động thể thao đa dạng</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg">
            <div className="text-6xl mx-auto">💼</div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">Nghề nghiệp</h3>
            <p className="text-gray-600 mt-2">Ngày hội việc làm, tuyển dụng và phát triển kỹ năng</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EventCategories;
