import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-toastify';
import { User } from '../../types';
import userService from '../../services/userService';
import { XIcon } from '@heroicons/react/outline';
import { IoSchoolOutline, IoPersonOutline, IoCallOutline, IoCalendarOutline, IoCloseCircleOutline, IoSaveOutline, IoWarningOutline, IoBusiness } from 'react-icons/io5';
import { FaFacebook, FaLinkedin, FaGithub, FaInstagram } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: User | null;
  onProfileUpdate: (updatedUser: User) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  userData,
  onProfileUpdate
}) => {
  const { refetchUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => {
    // Xử lý trường hợp socialMedia là string JSON
    let socialMedia = userData?.socialMedia;
    if (socialMedia && typeof socialMedia === 'string') {
      try {
        socialMedia = JSON.parse(socialMedia);
      } catch (e) {
        console.error('Error parsing socialMedia JSON:', e);
        socialMedia = { facebook: '', linkedin: '', github: '', instagram: '' };
      }
    }

    return {
      fullName: userData?.fullName || '',
      userId: userData?.userId || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      class: userData?.class || '',
      birthday: userData?.birthday ? new Date(userData.birthday).toISOString().split('T')[0] : '',
      facebook: socialMedia?.facebook || '',
      linkedin: socialMedia?.linkedin || '',
      github: socialMedia?.github || '',
      instagram: socialMedia?.instagram || '',
    };
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData?._id) {
      toast.error('ID người dùng không tồn tại');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Tạo đối tượng FormData mới
      const updateData = new FormData();
      
      // Thêm các giá trị từ state formData vào đối tượng FormData
      // Xử lý các trường cơ bản
      const basicFields = ['fullName', 'userId', 'email', 'phone', 'class', 'birthday'];
      basicFields.forEach(key => {
        const formValue = formData[key as keyof typeof formData];
        const userValue = userData?.[key as keyof User];
        
        // Chỉ thêm các trường có giá trị và khác với giá trị hiện tại
        if (formValue && formValue !== userValue) {
          updateData.append(key, formValue.toString());
        }
      });
      
      // Xử lý các trường mạng xã hội - luôn gửi tất cả các trường để đảm bảo dữ liệu đồng bộ
      const socialMediaObj: Record<string, string> = {
        facebook: formData.facebook || '',
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        instagram: formData.instagram || ''
      };
      
      // Luôn gửi đối tượng socialMedia đầy đủ
      updateData.append('socialMedia', JSON.stringify(socialMediaObj));

      let response;
      
      // Sử dụng API phù hợp dựa trên quyền của người dùng
      const currentUserId = localStorage.getItem('userId');
      if (userData._id === currentUserId) {
        response = await userService.updateProfile(updateData);
        await refetchUserData();
      } else {
        response = await userService.updateUser(userData._id, updateData);
      }

      if (onProfileUpdate) {
        onProfileUpdate(response);
      }
      
      toast.success('Cập nhật hồ sơ thành công');
      onClose();
    } catch (error: unknown) {
      console.error('Lỗi khi cập nhật:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tạo chữ cái đầu từ tên người dùng
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={loading ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                {/* Header với gradient */}
                <div className="bg-orange-600 p-6 text-white relative h-28">
                  <h2 className="text-xl font-bold leading-6">
                    {/* Chỉnh sửa hồ sơ */}
                  </h2>
                  <p className="mt-1 text-orange-100 text-sm opacity-90">
                    {/* {userData?.fullName || 'Người dùng'} */}
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-4 top-4 rounded-full p-1.5 bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Avatar Preview */}
                <div className="flex justify-center -mt-12">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-orange-100 flex items-center justify-center">
                      {userData?.avatar?.url ? (
                        <img 
                          src={userData.avatar.url} 
                          alt={userData.fullName || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-orange-600">
                          {userData?.fullName ? getInitials(userData.fullName) : 'U'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phần hiển thị lỗi */}
                {error && (
                  <div className="mx-6 mt-16 mb-2 p-3 bg-red-50 border-l-4 border-red-500 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <IoWarningOutline className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 pt-16 space-y-5">
                  {/* Họ và tên */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center group-focus-within:text-orange-600 transition-colors">
                      <IoPersonOutline className="mr-2 text-orange-500" />
                      Họ và tên
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* MSSV/MCB */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center group-focus-within:text-orange-600 transition-colors">
                      <IoSchoolOutline className="mr-2 text-orange-500" />
                      MSSV/MCB
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center group-focus-within:text-orange-600 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Hai cột cho lớp và số điện thoại */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Lớp */}
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center group-focus-within:text-orange-600 transition-colors">
                        <IoBusiness className="mr-2 text-orange-500" />
                        Lớp
                      </label>
                      <input
                        type="text"
                        name="class"
                        value={formData.class}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center group-focus-within:text-orange-600 transition-colors">
                        <IoCallOutline className="mr-2 text-orange-500" />
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        pattern="[0-9]{10}"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Ngày sinh */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center group-focus-within:text-orange-600 transition-colors">
                      <IoCalendarOutline className="mr-2 text-orange-500" />
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Liên kết mạng xã hội */}
                  <div className="mt-6 mb-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Liên kết mạng xã hội</h3>
                    <div className="space-y-4">
                      {/* Facebook */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FaFacebook className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-grow">
                          <input
                            type="url"
                            name="facebook"
                            value={formData.facebook}
                            onChange={handleChange}
                            placeholder="https://facebook.com/your-profile"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* LinkedIn */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FaLinkedin className="h-6 w-6 text-blue-700" />
                        </div>
                        <div className="flex-grow">
                          <input
                            type="url"
                            name="linkedin"
                            value={formData.linkedin}
                            onChange={handleChange}
                            placeholder="https://linkedin.com/in/your-profile"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* GitHub */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FaGithub className="h-6 w-6 text-gray-800" />
                        </div>
                        <div className="flex-grow">
                          <input
                            type="url"
                            name="github"
                            value={formData.github}
                            onChange={handleChange}
                            placeholder="https://github.com/your-username"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Instagram */}
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <FaInstagram className="h-6 w-6 text-pink-600" />
                        </div>
                        <div className="flex-grow">
                          <input
                            type="url"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            placeholder="https://instagram.com/your-username"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nút thao tác */}
                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg flex items-center disabled:opacity-50 transition-colors shadow-sm"
                    >
                      <IoCloseCircleOutline className="mr-1.5 h-5 w-5" />
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center disabled:opacity-70 transition-all shadow-sm">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <IoSaveOutline className="mr-1.5 h-5 w-5" />
                          Lưu thay đổi
                        </>
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

export default ProfileEditModal; 