import React, { useState } from 'react';
import Header from '../../components/Header';
import { IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

const Accessibility: React.FC = () => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('');
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call here
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowFeedbackModal(false);
      // Reset form
      setFeedbackType('');
      setDescription('');
    }, 2000);
  };

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
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Tiếp cận</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Khả năng tiếp cận</h1>
          <p className="text-xl opacity-90 max-w-2xl">
            Cam kết mang đến trải nghiệm tốt nhất cho mọi người dùng
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-8xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-12">
            <section>
              <h2 className="text-2xl font-bold mb-6">Cam kết của chúng tôi</h2>
              <p className="text-gray-600 mb-6">
                Event Hutech cam kết tạo ra một nền tảng tiếp cận được cho tất cả người dùng, 
                bao gồm những người có nhu cầu đặc biệt.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Thiết kế phổ quát</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Giao diện thân thiện với người dùng</li>
                    <li>• Tương thích với trình đọc màn hình</li>
                    <li>• Điều hướng bằng bàn phím</li>
                    <li>• Phông chữ dễ đọc</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Hỗ trợ công nghệ</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>• Tương thích WCAG 2.1</li>
                    <li>• Hỗ trợ ARIA landmarks</li>
                    <li>• Alt text cho hình ảnh</li>
                    <li>• Video có phụ đề</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Tính năng trợ năng</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Tùy chỉnh hiển thị</h3>
                    <p className="text-gray-600">
                      Điều chỉnh kích thước chữ, độ tương phản và màu sắc để phù hợp với nhu cầu của bạn
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⌨️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Điều hướng bàn phím</h3>
                    <p className="text-gray-600">
                      Sử dụng phím tắt và điều hướng dễ dàng qua bàn phím
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6">Liên hệ hỗ trợ</h2>
              <p className="text-gray-600 mb-4">
                Nếu bạn gặp khó khăn trong việc truy cập hoặc có đề xuất cải thiện, 
                vui lòng liên hệ với chúng tôi.
              </p>
              <button 
                onClick={() => setShowFeedbackModal(true)}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Gửi phản hồi
              </button>
            </section>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full relative">
            <button 
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <IoCloseOutline className="w-6 h-6" />
            </button>

            {showSuccess ? (
              <div className="p-8 text-center">
                <IoCheckmarkCircleOutline className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cảm ơn bạn!</h3>
                <p className="text-gray-600">
                  Phản hồi của bạn đã được ghi nhận. Chúng tôi sẽ xem xét và cải thiện dịch vụ.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Gửi phản hồi</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại phản hồi
                    </label>
                    <select
                      value={feedbackType}
                      onChange={(e) => setFeedbackType(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                      <option value="">Chọn loại phản hồi</option>
                      <option value="accessibility">Vấn đề về khả năng tiếp cận</option>
                      <option value="technical">Lỗi kỹ thuật</option>
                      <option value="suggestion">Đề xuất cải thiện</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải..."
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(false)}
                      className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Gửi phản hồi
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Accessibility;
