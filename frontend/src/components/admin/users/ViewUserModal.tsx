import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon, UserIcon } from '@heroicons/react/outline';
import type { User } from '@/types';
import { getSafeAvatarUrl } from '../../../utils/avatarUtils';

interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const ViewUserModal = ({ isOpen, onClose, user }: ViewUserModalProps) => {
  if (!user) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const translateRole = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'teacher':
        return 'Giảng viên';
      case 'student':
        return 'Sinh viên';
      default:
        return role;
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-2xl bg-white rounded-xl shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold">
                    Thông tin chi tiết người dùng
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Avatar and Basic Info */}                  <div className="flex items-center gap-4">
                    {getSafeAvatarUrl(user.avatar) !== '/default-avatar.png' ? (
                      <img src={getSafeAvatarUrl(user.avatar)} alt="" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-medium">{user.fullName}</h3>
                      <p className="text-gray-500">ID: {user.userId}</p>
                    </div>
                  </div>

                  {/* User Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Tên đăng nhập</label>
                      <p className="font-medium">{user.username}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Vai trò</label>
                      <p className="font-medium">{translateRole(user.role)}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Email</label>
                      <p className="font-medium">{user.email}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Số điện thoại</label>
                      <p className="font-medium">{user.phone}</p>
                    </div>

                    {/* Only show class for students */}
                    {user.role === 'student' && (
                      <div>
                        <label className="text-sm text-gray-500">Lớp</label>
                        <p className="font-medium">{user.class}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm text-gray-500">Giới tính</label>
                      <p className="font-medium capitalize">{user.gender}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Ngày sinh</label>                      <p className="font-medium">{user.birthday ? formatDate(user.birthday.toString()) : 'Chưa cập nhật'}</p>
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Ngày tạo tài khoản</label>
                      <p className="font-medium">{user.createdAt ? formatDate(user.createdAt.toString()) : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ViewUserModal;
