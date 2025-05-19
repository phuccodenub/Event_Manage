import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../../context/AuthContext';
import communityService from '../../services/communityService';
import type { Community } from '../../services/communityService';
import JoinRequestButton from './JoinRequestButton';
import LoadingSpinner from '../LoadingSpinner';
import ErrorAlert from '../ErrorAlert';
import Header from '../Header';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  IoArrowBack, 
  IoPeopleOutline,
  IoPersonOutline,
  IoPencil,
  IoTrash,
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

const isValidMongoId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdminOrTeacher = user && ['admin', 'teacher'].includes(user.role);

  useEffect(() => {
    if (id) {
      if (!isValidMongoId(id)) {
        setError('ID cộng đồng không hợp lệ');
        setIsLoading(false);
        return;
      }
      loadCommunityDetails();
    }
  }, [id]);

  const loadCommunityDetails = async () => {
    if (!id || !isValidMongoId(id)) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await communityService.getCommunityDetails(id);
      setCommunity(data);
    } catch (error: any) {
      console.error('Lỗi khi tải thông tin cộng đồng:', error);
      setError(error.message || 'Không thể tải thông tin cộng đồng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingRequest(true);
      await communityService.handleJoinRequest(requestId, status);
      await loadCommunityDetails(); // Tải lại thông tin sau khi xử lý yêu cầu
    } catch (error: any) {
      console.error('Lỗi khi xử lý yêu cầu tham gia:', error);
      setError(error.message || 'Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleBackToList = () => {
    navigate('/community');
  };

  const handleEditCommunity = () => {
    if (community) {
      setFormData({
        name: community.name,
        description: community.description,
        isActive: community.isActive,
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
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
    
    if (!community || !id) return;
    
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
      
      await communityService.updateCommunity(id, submitData);
      
      // Đóng modal và tải lại thông tin
      handleCloseModal();
      await loadCommunityDetails();
    } catch (error: any) {
      console.error('Lỗi khi lưu cộng đồng:', error);
      setError(error.message || 'Không thể lưu thông tin cộng đồng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community) return;
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa cộng đồng "${community.name}"?`)) {
      try {
        setIsLoading(true);
        await communityService.deleteCommunity(community._id);
        navigate('/community');
      } catch (error: any) {
        console.error('Lỗi khi xóa cộng đồng:', error);
        setError(error.message || 'Không thể xóa cộng đồng. Vui lòng thử lại sau.');
        setIsLoading(false);
      }
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <button 
            onClick={handleBackToList}
            className="mb-6 flex items-center text-gray-600 hover:text-orange-600 transition-colors"
          >
            <IoArrowBack className="mr-2" />
            Quay lại danh sách cộng đồng
          </button>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <ErrorAlert message={error} />
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy cộng đồng</h2>
          <button 
            onClick={handleBackToList}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Quay lại danh sách cộng đồng
          </button>
        </div>
      </div>
    );
  }

  const isMember = community.members.some(member => member.user._id === user?._id);
  const hasPendingRequest = community.pendingRequests?.some(
    request => request.user._id === user?._id && request.status === 'pending'
  );
  const isLeader = community.leader._id === user?._id;
  const isDeputy = community.deputies?.some(deputy => deputy._id === user?._id);
  const canManage = isLeader || isDeputy || (user && ['admin', 'teacher'].includes(user.role));

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      {/* Banner */}
      <div className="relative h-48 md:h-64 lg:h-80 bg-gray-300 overflow-hidden">
        {community.banner?.url ? (
          <img
            src={community.banner.url}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
            <IoPeopleOutline className="text-6xl text-white opacity-50" />
          </div>
        )}
      </div>

      {/* Community Info */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 mb-6">
          <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
            {/* Avatar */}
            <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-white p-1 border-4 border-white shadow-md overflow-hidden -mt-12 md:-mt-20">
                <img
                  src={community.avatar?.url || '/default-community.png'}
                  alt={community.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/default-community.png';
                  }}
                />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{community.name}</h1>
                  <p className="text-gray-600 mt-1">
                    <span className="flex items-center">
                      <IoPersonOutline className="mr-1" />
                      Leader: {community.leader.fullName}
                    </span>
                  </p>
                  <p className="text-gray-600 mt-1">
                    <span className="flex items-center">
                      <IoPeopleOutline className="mr-1" />
                      {community.members.length} thành viên
                    </span>
                  </p>
                </div>
                
                <div className="flex space-x-3 mt-4 md:mt-0">
                  {!isLeader && !isDeputy && (
                    <JoinRequestButton
                      communityId={community._id}
                      isMember={isMember}
                      hasPendingRequest={hasPendingRequest}
                      onRequestSent={loadCommunityDetails}
                    />
                  )}
                  
                  {canManage && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleEditCommunity}
                        className="flex items-center px-4 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg transition-colors"
                      >
                        <IoPencil className="mr-1" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={handleDeleteCommunity}
                        className="flex items-center px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <IoTrash className="mr-1" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 bg-orange-50 p-4 rounded-lg">
                <h2 className="font-semibold text-orange-800 mb-2">Giới thiệu</h2>
                <p className="text-gray-700">{community.description}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left column: Members */}
          <div className="lg:col-span-2">
            {/* Members */}
            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <IoPeopleOutline className="mr-2 text-orange-500" />
                Thành viên ({community.members.length})
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {community.members.map(member => (
                  <div key={member._id} className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border border-gray-200">
                      <img
                        src={member.user.avatar?.url || '/default-avatar.png'}
                        alt={member.user.fullName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = '/default-avatar.png';
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-800 font-medium line-clamp-1">
                      {member.user.fullName}
                    </span>
                    {community.leader._id === member.user._id && (
                      <span className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-0.5 rounded-full">Leader</span>
                    )}
                    {community.deputies?.some(deputy => deputy._id === member.user._id) && (
                      <span className="text-xs text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded-full">Deputy</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right column: Pending Requests */}
          <div className="lg:col-span-1">
            {/* Pending Requests - Only visible to leader and deputies */}
            {canManage && community.pendingRequests?.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Yêu cầu tham gia ({community.pendingRequests.filter(r => r.status === 'pending').length})
                </h2>
                {processingRequest && (
                  <div className="mb-4 bg-blue-50 p-2 rounded text-blue-700 text-sm flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý yêu cầu...
                  </div>
                )}
                <div className="space-y-3">
                  {community.pendingRequests
                    .filter(request => request.status === 'pending')
                    .map(request => (
                      <div
                        key={request._id}
                        className="flex items-center justify-between bg-gray-50 p-4 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={request.user.avatar?.url || '/default-avatar.png'}
                            alt={request.user.fullName}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/default-avatar.png';
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-800">
                              {request.user.fullName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(request.requestDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleJoinRequest(request._id, 'approved')}
                            disabled={processingRequest}
                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleJoinRequest(request._id, 'rejected')}
                            disabled={processingRequest}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Community Modal */}
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
                      Chỉnh sửa cộng đồng
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
                            Đang lưu...
                          </span>
                        ) : (
                          'Lưu thay đổi'
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
    </div>
  );
};

export default CommunityDetail;