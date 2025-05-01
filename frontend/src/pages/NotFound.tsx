import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-orange-600">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mt-4">Trang không tồn tại</h2>
        <p className="text-gray-600 mt-2">Xin lỗi, trang bạn đang tìm kiếm không tồn tại.</p>
        
        <Link 
          to="/"
          className="inline-block mt-8 px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
