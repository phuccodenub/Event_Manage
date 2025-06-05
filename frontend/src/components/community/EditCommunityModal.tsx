import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { IoClose, IoImageOutline } from 'react-icons/io5';
import uploadService from '../../services/uploadService';
import communityService from '../../services/communityService';

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

interface EditCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  community: any;
  setError: (error: string | null) => void;
}

const EditCommunityModal: React.FC<EditCommunityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  community,
  setError
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: community?.name || '',
    description: community?.description || '',
    isActive: community?.isActive ?? true,
    avatar: {
      url: community?.avatar?.url || '',
      public_id: community?.avatar?.public_id || undefined,
    },
    banner: {
      url: community?.banner?.url || '',
      public_id: community?.banner?.public_id || undefined,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (community && isOpen) {
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
    }
  }, [community, isOpen]);

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

    const imageUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      [field]: {
        url: imageUrl,
        file
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!community?._id) return;
    
    if (!formData.name.trim()) {
      setError('Tên cộng đồng không được để trống');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
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
          setError(`Lỗi khi tải lên ảnh bìa: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }
      }
      
      await communityService.updateCommunity(community._id, submitData);
      onSuccess();
    } catch (error: any) {
      setError(error.message || 'Không thể lưu thông tin cộng đồng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    onClick={onClose}
                  >
                    <IoClose className="h-5 w-5" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={onClose}
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
  );
};

export default EditCommunityModal; 