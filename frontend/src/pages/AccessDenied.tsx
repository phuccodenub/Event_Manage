import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="text-6xl text-red-500 mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Quyền truy cập bị từ chối</h1>
        <p className="text-gray-600 mb-6">
          Bạn không có quyền truy cập vào trang này. Vui lòng liên hệ với quản trị viên nếu bạn cần hỗ trợ.
        </p>
        <div className="flex justify-center">
          <Link
            to="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition-colors"
          >
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied; 