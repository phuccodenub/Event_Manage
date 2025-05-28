import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import communityService from '../../services/communityService';
import type { Community } from '../../services/communityService';
import CommunityCard from './CommunityCard';
import LoadingSpinner from '../LoadingSpinner';
import ErrorAlert from '../ErrorAlert';
import { Link } from 'wouter';
import Header from '../Header';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  IoSearchOutline, 
  IoFilterOutline,
  IoPeopleOutline,
  IoAdd,
  IoClose,
  IoImageOutline
} from 'react-icons/io5';
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

const CommunityList: React.FC = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const isAdminOrTeacher = ['admin', 'teacher'].includes(user?.role || '');

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await communityService.getAllCommunities();
      setCommunities(data);
    } catch (error: any) {
      console.error('Lỗi khi tải danh sách cộng đồng:', error);
      setError(error.message || 'Không thể tải danh sách cộng đồng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadCommunities();
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const results = await communityService.searchCommunities(searchQuery);
      setCommunities(results);
    } catch (error: any) {
      console.error('Lỗi khi tìm kiếm cộng đồng:', error);
      setError(error.message || 'Không thể tìm kiếm cộng đồng. Vui lòng thử lại sau.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateCommunity = () => {
    setModalMode('create');
    setFormData(initialFormData);
    setSelectedCommunity(null);
    setIsModalOpen(true);
  };

  const handleEditCommunity = (community: Community) => {
    setModalMode('edit');
    setSelectedCommunity(community);
    setFormData({
      name: community.name,
      description: community.description,
      isActive: community.isActive ?? true,
      avatar: {
        url: community.avatar?.url || '',
        public_id: community.avatar?.public_id || undefined,
      },
      banner: {
        url: community.banner?.url || '',
        public_id: community.banner?.public_id || undefined,
      },
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setFormData(initialFormData);
      setSelectedCommunity(null);
    }, 300);
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
      
      if (modalMode === 'edit' && selectedCommunity) {
        await communityService.updateCommunity(selectedCommunity._id, submitData);
      } else {
        await communityService.createCommunity(submitData);
      }
      
      // Đóng modal và tải lại danh sách
      handleCloseModal();
      await loadCommunities();
    } catch (error: any) {
      console.error('Lỗi khi lưu cộng đồng:', error);
      setError(error.message || 'Không thể lưu thông tin cộng đồng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }} />
            </div>
            <div className="container mx-auto px-4 relative">
              <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Cộng đồng</span>
              <h1 className="text-5xl font-bold mb-4 leading-tight">Cộng Đồng HUTECH</h1>
              <p className="text-xl opacity-90 max-w-2xl">Khám phá và tham gia các cộng đồng học thuật, sở thích và hoạt động của HUTECH</p>
            </div>
          </div>

          {/* Search Section */}
          <div className="container mx-auto px-4">
            <div className="relative -mt-8 mb-10">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full sm:w-auto flex-grow">
                    <IoSearchOutline className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm cộng đồng..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <button
                    onClick={() => setFiltersVisible(!filtersVisible)}
                    className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-lg transition-all w-full sm:w-auto justify-center"
                  >
                    <IoFilterOutline />
                    <span>Bộ lọc</span>
                  </button>
                </div>

                {/* Có thể thêm filter ở đây khi cần */}
              </div>
            </div>

            {error && (
              <div className="mb-6">
                <ErrorAlert message={error} />
              </div>
            )}

            {/* Content Section */}
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <IoPeopleOutline className="text-orange-500" />
                {communities.length > 0 ? 
                  `Cộng đồng (${communities.length})` : 
                  'Không có cộng đồng nào'}
              </h2>
              
              {isAdminOrTeacher && (
                <button 
                  onClick={handleCreateCommunity}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-all"
                >
                  <IoAdd className="text-lg" />
                  <span>Tạo cộng đồng mới</span>
                </button>
              )}
            </div>

            {communities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {communities.map((community) => (
                  <CommunityCard 
                    key={community._id} 
                    community={community} 
                    onUpdate={loadCommunities}
                    onDelete={(id) => {
                      setCommunities(prev => prev.filter(c => c._id !== id));
                    }}
                    onJoinRequest={loadCommunities}
                    onEdit={handleEditCommunity}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-10 text-center mb-10">
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-orange-100 p-4 rounded-full mb-4">
                    <IoPeopleOutline className="text-6xl text-orange-500" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    {searchQuery ? 
                      'Không tìm thấy cộng đồng nào phù hợp' : 
                      'Chưa có cộng đồng nào được tạo'}
                  </h3>
                  <p className="text-gray-500 max-w-lg mb-6">
                    {searchQuery ? 
                      'Hãy thử tìm kiếm với từ khóa khác hoặc tạo cộng đồng mới' : 
                      'Hãy tạo cộng đồng đầu tiên để bắt đầu kết nối mọi người'}
                  </p>
                  
                  {isAdminOrTeacher && !searchQuery && (
          <button
            onClick={handleCreateCommunity}
                      className="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition-all flex items-center gap-2"
                    >
                      <IoAdd />
                      <span>Tạo cộng đồng đầu tiên</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Community Form Modal */}
          <Transition show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title
                        as="div"
                        className="flex justify-between items-center border-b pb-3 mb-4"
                      >
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          {modalMode === 'create' ? 'Tạo cộng đồng mới' : 'Chỉnh sửa cộng đồng'}
                        </h3>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-500"
                          onClick={handleCloseModal}
                        >
                          <IoClose className="h-5 w-5" />
                        </button>
                      </Dialog.Title>

                      <form onSubmit={handleSubmit} className="space-y-4">
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

                        {/* Ảnh đại diện và banner */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Avatar */}
                          <div>
                            <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                              Ảnh đại diện
                            </label>
                            <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4">
                              {formData.avatar?.url ? (
                                <div className="flex flex-col items-center mb-4">
                                  <div className="w-24 h-24 rounded-lg overflow-hidden mb-2">
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
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-24 mb-4">
                                  <IoImageOutline className="text-4xl text-gray-400" />
                                </div>
                              )}
                              <div className="flex items-center justify-center">
                                <label className="cursor-pointer px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg inline-block text-sm">
                                  <span className="flex items-center">
                                    <IoImageOutline className="mr-1" />
                                    {formData.avatar?.url ? 'Thay đổi' : 'Tải lên'}
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
                            </div>
                          </div>

                          {/* Banner */}
                          <div>
                            <label htmlFor="banner" className="block text-sm font-medium text-gray-700 mb-1">
                              Ảnh bìa
                            </label>
                            <div className="border border-dashed border-gray-300 bg-gray-50 rounded-lg p-4">
                              {formData.banner?.url ? (
                                <div className="w-full h-24 rounded-lg overflow-hidden mb-4">
                                  <img
                                    src={formData.banner.url}
                                    alt="Banner preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-24 mb-4 bg-gray-100 rounded-lg">
                                  <IoImageOutline className="text-4xl text-gray-400" />
                                </div>
                              )}
                              <div className="flex items-center justify-center">
                                <label className="cursor-pointer px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg inline-block text-sm">
                                  <span className="flex items-center">
                                    <IoImageOutline className="mr-1" />
                                    {formData.banner?.url ? 'Thay đổi' : 'Tải lên'}
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
                            </div>
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
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
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
                                {modalMode === 'edit' ? 'Đang lưu...' : 'Đang tạo...'}
              </span>
            ) : (
                              modalMode === 'edit' ? 'Lưu thay đổi' : 'Tạo cộng đồng'
            )}
          </button>
      </div>
                      </form>
                    </Dialog.Panel>
                  </Transition.Child>
        </div>
      </div>
            </Dialog>
          </Transition>
        </>
      )}
    </div>
  );
};

export default CommunityList;
