import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section
      className="relative bg-gray-800 text-white text-center py-16 bg-cover bg-center h-[380px]"
      style={{
        backgroundImage: "url('https://tse1.mm.bing.net/th/id/OIP.kSpI0Pmw0QQI01pM7xCXtQHaEK?w=1280&h=720&rs=1&pid=ImgDetMain')",
      }}
    >
      <div className="absolute inset-0 bg-black/70"></div>
      <div className="relative z-10">
        <h1 className="text-4xl font-bold">Khám phá sự kiện tại Hutech</h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto">
          Tham gia các sự kiện học thuật, văn hóa và hoạt động ngoại khóa tại Đại học Công nghệ TP.HCM
        </p>
        <div className="mt-6 flex justify-center space-x-4">
          <button className="bg-orange-500 px-6 py-3 rounded text-white hover:bg-orange-600">Tìm sự kiện</button>
          <button className="border border-orange-500 text-orange-500 px-6 py-3 rounded hover:bg-orange-100">Tạo sự kiện</button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
