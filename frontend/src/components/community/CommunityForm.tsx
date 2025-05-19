import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import communityService from '../../services/communityService';
import type { Community } from '../../services/communityService';
import LoadingSpinner from '../LoadingSpinner';
import ErrorAlert from '../ErrorAlert';
import Header from '../Header';
import { IoArrowBack, IoImageOutline } from 'react-icons/io5';
import uploadService from '../../services/uploadService';

interface FormData {
  name: string;
  description: string;
  isActive: boolean;
  avatar?: {
    url: string;
    public_id?: string;
    file?: File;
  };
  banner?: {
    url: string;
    public_id?: string;
    file?: File;
  };
}

const initialFormData: FormData = {
  name: '',
  description: '',
  isActive: true,
  avatar: {
    url: '',
  },
  banner: {
    url: '',
  },
};

const isValidMongoId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const CommunityForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(id);

  // Redirect if not admin or teacher
  useEffect(() => {
    if (user && !['admin', 'teacher'].includes(user.role)) {
      navigate('/community');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Nếu là trang edit, load dữ liệu cộng đồng
    if (isEdit && id) {
      loadCommunity();
    }
  }, [id]);

  const loadCommunity = async () => {
    if (!id || !isValidMongoId(id)) {
      setError('ID cộng đồng không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      const data = await communityService.getCommunityDetails(id);
      setFormData({
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        avatar: {
          url: data.avatar?.url || '',
          public_id: data.avatar?.public_id || undefined,
        },
        banner: {
          url: data.banner?.url || '',
          public_id: data.banner?.public_id || undefined,
        },
      });
    } catch (error: any) {
      console.error('Lỗi khi tải thông tin cộng đồng:', error);
      setError(error.message || 'Không thể tải thông tin cộng đồng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tạm thời chỉ lưu URL để hiển thị preview
    const imageUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      [field]: {
        url: imageUrl,
        file // Lưu file để upload sau
      }
    }));
  };

  const handleBackToList = () => {
    navigate('/community');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.name.trim()) {
      setError('Tên cộng đồng không được để trống');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Chuẩn bị dữ liệu để gửi
      const submitData: any = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
      };
      
      // Upload avatar nếu có
      if (formData.avatar?.file) {
        try {
          const avatarResult = await uploadService.uploadCommunityImage(formData.avatar.file, 'avatar');
          submitData.avatar = {
            public_id: avatarResult.public_id,
            url: avatarResult.url
          };
        } catch (uploadError: any) {
          console.error('Lỗi upload avatar:', uploadError);
          setError(`Lỗi khi tải lên ảnh đại diện: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Upload banner nếu có
      if (formData.banner?.file) {
        try {
          const bannerResult = await uploadService.uploadCommunityImage(formData.banner.file, 'banner');
          submitData.banner = {
            public_id: bannerResult.public_id,
            url: bannerResult.url
          };
        } catch (uploadError: any) {
          console.error('Lỗi upload banner:', uploadError);
          setError(`Lỗi khi tải lên ảnh bìa: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      if (isEdit && id) {
        await communityService.updateCommunity(id, submitData);
      } else {
        await communityService.createCommunity(submitData);
      }
      
      // Chuyển về trang danh sách sau khi thành công
      navigate('/community');
    } catch (error: any) {
      console.error('Lỗi khi lưu cộng đồng:', error);
      setError(error.message || 'Không thể lưu thông tin cộng đồng');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-orange-600 text-white py-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <button 
            onClick={handleBackToList}
            className="flex items-center text-white hover:text-orange-200 transition-colors mb-4"
          >
            <IoArrowBack className="mr-2" />
            <span>Quay lại danh sách cộng đồng</span>
          </button>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Chỉnh sửa cộng đồng' : 'Tạo cộng đồng mới'}
          </h1>
          <p className="mt-2 opacity-90">
            {isEdit ? 'Cập nhật thông tin cộng đồng' : 'Điền đầy đủ thông tin để tạo cộng đồng mới'}
          </p>
        </div>
      </div>
      
      {/* Form Section */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="grid grid-cols-1 gap-6">
              {/* Tên cộng đồng */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên cộng đồng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Nhập tên cộng đồng"
                  required
                />
              </div>

              {/* Mô tả */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 min-h-[120px]"
                  placeholder="Mô tả về cộng đồng, mục đích, hoạt động..."
                />
              </div>

              {/* Avatar */}
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh đại diện
                </label>
                <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4">
                  {formData.avatar?.url ? (
                    <div className="flex flex-col items-center mb-4">
                      <div className="w-28 h-28 rounded-lg overflow-hidden mb-2">
                        <img
                          src={formData.avatar.url}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/default-community.png';
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Ảnh hiện tại</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-28 mb-4">
                      <IoImageOutline className="text-4xl text-gray-400" />
                    </div>
                  )}
                  <div className="flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg inline-block">
                      <span className="flex items-center">
                        <IoImageOutline className="mr-2" />
                        {formData.avatar?.url ? 'Thay đổi ảnh đại diện' : 'Tải lên ảnh đại diện'}
                      </span>
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        onChange={(e) => handleImageChange(e, 'avatar')}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">Hỗ trợ file PNG, JPG. Kích thước tối đa 2MB</p>
                </div>
              </div>

              {/* Banner */}
              <div>
                <label htmlFor="banner" className="block text-sm font-medium text-gray-700 mb-1">
                  Ảnh bìa
                </label>
                <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4">
                  {formData.banner?.url ? (
                    <div className="w-full h-40 rounded-lg overflow-hidden mb-4">
                      <img
                        src={formData.banner.url}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 mb-4 bg-gray-100 rounded-lg">
                      <IoImageOutline className="text-4xl text-gray-400" />
                    </div>
                  )}
                  <div className="flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg inline-block">
                      <span className="flex items-center">
                        <IoImageOutline className="mr-2" />
                        {formData.banner?.url ? 'Thay đổi ảnh bìa' : 'Tải lên ảnh bìa'}
                      </span>
                      <input
                        type="file"
                        id="banner"
                        name="banner"
                        onChange={(e) => handleImageChange(e, 'banner')}
                        className="hidden"
                        accept="image/*"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">Kích thước tối ưu: 1200x400px</p>
                </div>
              </div>

              {/* Trạng thái */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 mr-3"
                  />
                  <div>
                    <label htmlFor="isActive" className="block text-sm font-medium text-gray-800">
                      Kích hoạt cộng đồng
                    </label>
                    <p className="text-xs text-gray-500 mt-0.5">Cộng đồng sẽ hiển thị với tất cả người dùng nếu được kích hoạt</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEdit ? 'Đang lưu...' : 'Đang tạo...'}
                    </span>
                  ) : (
                    isEdit ? 'Lưu thay đổi' : 'Tạo cộng đồng'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityForm; 