import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'react-toastify';
import communityService from '@/services/communityService';
import userService from '@/services/userService';
import { User } from '@/types';
import { PhotographIcon, ArrowLeftIcon } from '@heroicons/react/outline';

const CreateCommunity: React.FC = () => {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: null as File | null,
    leaderId: '',
    isPrivate: false,
    rules: '',
    category: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const userData = await userService.getUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    try {
      setLoading(true);
      
      const communityData = {
        name: formData.name,
        description: formData.description,
        isActive: true
      };

      await communityService.createCommunity(communityData);
      toast.success('Tạo cộng đồng thành công!');
      setLocation('/admin/communities');
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast.error(error.message || 'Có lỗi xảy ra khi tạo cộng đồng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => setLocation('/admin/communities')}
          className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Quay lại
        </button>
        <h1 className="text-2xl font-bold">Tạo cộng đồng mới</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tên cộng đồng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên cộng đồng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên cộng đồng..."
              required
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập mô tả cộng đồng..."
              required
            />
          </div>

          {/* Danh mục */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn danh mục...</option>
              <option value="academic">Học thuật</option>
              <option value="social">Xã hội</option>
              <option value="sports">Thể thao</option>
              <option value="technology">Công nghệ</option>
              <option value="arts">Nghệ thuật</option>
              <option value="volunteer">Tình nguyện</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {/* Người quản lý */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Người quản lý <span className="text-red-500">*</span>
            </label>
            <select
              name="leaderId"
              value={formData.leaderId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Chọn người quản lý...</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.fullName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Avatar cộng đồng
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {formData.avatar && (
                <div className="flex items-center">
                  <PhotographIcon className="h-8 w-8 text-green-600" />
                  <span className="ml-2 text-sm text-green-600">Đã chọn file</span>
                </div>
              )}
            </div>
          </div>

          {/* Quy tắc */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quy tắc cộng đồng
            </label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập quy tắc cộng đồng (tùy chọn)..."
            />
          </div>

          {/* Cộng đồng riêng tư */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Cộng đồng riêng tư (yêu cầu phê duyệt để tham gia)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => setLocation('/admin/communities')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo cộng đồng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunity; 