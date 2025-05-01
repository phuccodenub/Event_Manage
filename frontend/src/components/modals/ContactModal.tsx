import React from 'react';
import { IoCloseOutline, IoMailOutline, IoCallOutline, IoBriefcaseOutline } from 'react-icons/io5';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
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
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Liên hệ với chúng tôi
          </h3>
          <p className="text-gray-600">
            Điền thông tin bên dưới và chúng tôi sẽ liên hệ lại trong thời gian sớm nhất
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tên doanh nghiệp
            </label>
            <div className="relative">
              <IoBriefcaseOutline className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="Tên công ty của bạn"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email doanh nghiệp
            </label>
            <div className="relative">
              <IoMailOutline className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="email"
                required
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="company@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <div className="relative">
              <IoCallOutline className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="0123456789"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nội dung cần tư vấn
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Mô tả nhu cầu của doanh nghiệp..."
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

export default ContactModal;
