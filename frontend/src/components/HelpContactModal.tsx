import React, { useState } from 'react';
import { IoCloseOutline, IoMailOutline, IoCallOutline, IoHelpCircleOutline } from 'react-icons/io5';

interface HelpContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpContactModal: React.FC<HelpContactModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState('');
  
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative animate-fade-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <IoCloseOutline className="w-6 h-6 text-gray-500" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <IoHelpCircleOutline className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Liên hệ hỗ trợ
          </h3>
          <p className="text-gray-600">
            Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Chủ đề hỗ trợ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              <option value="">Chọn chủ đề</option>
              <option value="account">Tài khoản</option>
              <option value="event">Sự kiện</option>
              <option value="technical">Kỹ thuật</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email của bạn
            </label>
            <div className="relative">
              <IoMailOutline className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Mô tả vấn đề
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"
            >
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HelpContactModal;
