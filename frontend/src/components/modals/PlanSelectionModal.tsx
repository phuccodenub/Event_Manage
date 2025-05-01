import React from 'react';
import { IoCloseOutline } from 'react-icons/io5';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string | null;
}

const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({ isOpen, onClose, selectedPlan }) => {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission logic
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
            Xác nhận chọn gói {selectedPlan}
          </h3>
          <p className="text-gray-600">
            Vui lòng điền thông tin để chúng tôi liên hệ tư vấn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên doanh nghiệp
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="Nhập tên doanh nghiệp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email liên hệ
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="example@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="tel"
              required
              pattern="[0-9]{10}"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              placeholder="0123456789"
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
              Gửi thông tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanSelectionModal;
