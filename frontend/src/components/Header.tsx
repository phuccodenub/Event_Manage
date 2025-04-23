import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-3 px-6">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <img
            src="https://media.loveitopcdn.com/3807/logo-hutech-2.png"
            alt="HUTECH Events Logo"
            className="h-10"
          />
          <h1 className="text-lg font-bold text-orange-600">HUTECH Events</h1>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 mx-6">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện, câu lạc bộ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none text-sm"
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-orange-600 text-sm">
            <i className="fas fa-home"></i> Trang chủ
          </Link>
          <Link to="/events" className="text-gray-700 hover:text-orange-600 text-sm">
            <i className="fas fa-calendar-alt"></i> Sự kiện
          </Link>
          <Link to="/notifications" className="text-gray-700 hover:text-orange-600 text-sm">
            <i className="fas fa-bell"></i> Thông báo
          </Link>
          <Link to="/community" className="text-gray-700 hover:text-orange-600 text-sm">
            <i className="fas fa-users"></i> Cộng đồng
          </Link>
        </nav>

        {/* User Profile */}
        <div className="hidden md:flex items-center space-x-4">
          <img
            src="https://media.loveitopcdn.com/3807/logo-hutech-2.png"
            alt="User Avatar"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;