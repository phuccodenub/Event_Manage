import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-toastify';
import { User } from '../../types';
import userService from '../../services/userService';
import { XIcon } from '@heroicons/react/outline';
import { IoSchoolOutline, IoPersonOutline, IoCallOutline, IoCalendarOutline } from 'react-icons/io5';

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    userId: userData?.userId || '',
    phone: userData?.phone || '',
    class: userData?.class || '',
    birthday: userData?.birthday ? new Date(userData.birthday).toISOString().split('T')[0] : '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData) {
      toast.error('Không tìm thấy thông tin người dùng');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create form data object
      const updateData = new FormData();
      
      // Only add fields that have changed from the original data
      if (formData.fullName !== userData.fullName)
        updateData.append('fullName', formData.fullName);
      
      if (formData.userId !== userData.userId)
        updateData.append('userId', formData.userId);
      
      if (formData.phone !== userData.phone)
        updateData.append('phone', formData.phone);
      
      if (formData.class !== userData.class)
        updateData.append('class', formData.class);
      
      if (formData.birthday !== (userData.birthday ? new Date(userData.birthday).toISOString().split('T')[0] : ''))
        updateData.append('birthday', formData.birthday);
      
      // Only proceed if there are changes
      if (updateData.entries().next().done) {
        toast.info('Không có thay đổi nào được thực hiện');
        onClose();
        return;
      }
      
      // Send update request
      const updatedUser = await userService.updateProfile(updateData);
      
      // Update context
      onProfileUpdate(updatedUser);
      
      toast.success('Cập nhật hồ sơ thành công');
      onClose();
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      const errorMessage = 
        error instanceof Error ? error.message : 
        typeof error === 'object' && error !== null && 'response' in error && 
        typeof error.response === 'object' && error.response !== null && 'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data !== null && 'message' in error.response.data ?
        String(error.response.data.message) : 'Lỗi cập nhật hồ sơ';
        
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Chỉnh sửa hồ sơ
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoPersonOutline className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Student/Staff ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MSSV/MCB
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoSchoolOutline className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoCallOutline className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        pattern="[0-9]{10}"
                        className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Định dạng: 10 số liên tục</p>
                    </div>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lớp
                    </label>
                    <input
                      type="text"
                      name="class"
                      value={formData.class}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>

                  {/* Birthday */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sinh
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IoCalendarOutline className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleChange}
                        className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
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