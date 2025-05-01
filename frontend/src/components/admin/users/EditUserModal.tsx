import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon, ExclamationIcon } from '@heroicons/react/outline';
import { toast } from 'react-toastify';
import type { User } from '@/types';
import userService from '@/services/userService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, userData: any) => Promise<void>;
  user: User | null;
}

const EditUserModal = ({ isOpen, onClose, onSubmit, user }: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    username: '',
    userId: '',
    fullName: '',
    email: '',
    phone: '',
    birthday: '',
    gender: 'nam',
    role: 'student',
    class: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // Format birthday to YYYY-MM-DD for input type="date"
      const formattedBirthday = user.birthday ? 
        new Date(user.birthday).toISOString().split('T')[0] : 
        '';

      setFormData({
        username: user.username,
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        birthday: formattedBirthday,
        gender: user.gender,
        role: user.role,
        class: user.role === 'student' ? (user.class || '') : ''
      });
    }
  }, [user]);

  // Add effect to clear class when role changes
  useEffect(() => {
    if (formData.role !== 'student') {
      setFormData(prev => ({ ...prev, class: '' }));
    }
  }, [formData.role]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username) newErrors.username = 'Tên đăng nhập là bắt buộc';
    if (!formData.userId) newErrors.userId = 'MSSV/MSGV là bắt buộc';
    if (!formData.fullName) newErrors.fullName = 'Họ tên là bắt buộc';
    if (!formData.email) newErrors.email = 'Email là bắt buộc';
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.phone) newErrors.phone = 'Số điện thoại là bắt buộc';
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (formData.role === 'student' && !formData.class) {
      newErrors.class = 'Lớp là bắt buộc đối với sinh viên';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && user?._id) {
      try {
        await onSubmit(user._id, formData);
        toast.success('Cập nhật người dùng thành công');
        onClose();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!user?._id) return;
    
    try {
      await userService.resetPassword(user._id);
      toast.success('Đặt lại mật khẩu thành công');
      setIsResetConfirmOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
    }
  };

  const ResetPasswordConfirmation = () => (
    <Transition show={isResetConfirmOpen} as={Fragment}>
      <Dialog onClose={() => setIsResetConfirmOpen(false)} className="relative z-[60]">
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
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <ExclamationIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    Xác nhận đặt lại mật khẩu
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-gray-500">
                    Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng <span className="font-medium text-gray-900">{user?.fullName}</span>? 
                    Mật khẩu mới sẽ là "<span className="font-medium">password123</span>".
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2"
                >
                  Xác nhận
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

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
                    Chỉnh sửa thông tin người dùng
                  </Dialog.Title>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Thông tin đăng nhập */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên đăng nhập</label>
                      <input
                        type="text"
                        className={`w-full p-2 border rounded-lg ${errors.username ? 'border-red-500' : ''}`}
                        value={formData.username}
                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      />
                      {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">MSSV/MSGV</label>
                      <input
                        type="text"
                        className={`w-full p-2 border rounded-lg ${errors.userId ? 'border-red-500' : ''}`}
                        value={formData.userId}
                        onChange={e => setFormData(prev => ({ ...prev, userId: e.target.value }))}
                      />
                      {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId}</p>}
                    </div>

                    {/* Thông tin cá nhân */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Họ và tên</label>
                      <input
                        type="text"
                        className={`w-full p-2 border rounded-lg ${errors.fullName ? 'border-red-500' : ''}`}
                        value={formData.fullName}
                        onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        className={`w-full p-2 border rounded-lg ${errors.email ? 'border-red-500' : ''}`}
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        className={`w-full p-2 border rounded-lg ${errors.phone ? 'border-red-500' : ''}`}
                        value={formData.phone}
                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Ngày sinh</label>
                      <input
                        type="date"
                        className="w-full p-2 border rounded-lg"
                        value={formData.birthday}
                        onChange={e => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Giới tính</label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={formData.gender}
                        onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                      >
                        <option value="nam">Nam</option>
                        <option value="nữ">Nữ</option>
                        <option value="khác">Khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Vai trò</label>
                      <select
                        className="w-full p-2 border rounded-lg"
                        value={formData.role}
                        onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      >
                        <option value="student">Sinh viên</option>
                        <option value="teacher">Giảng viên</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {/* Class field - Only show for students */}
                    {formData.role === 'student' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Lớp</label>
                        <input
                          type="text"
                          className={`w-full p-2 border rounded-lg ${errors.class ? 'border-red-500' : ''}`}
                          value={formData.class}
                          onChange={e => setFormData(prev => ({ ...prev, class: e.target.value }))}
                        />
                        {errors.class && <p className="text-red-500 text-xs mt-1">{errors.class}</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsResetConfirmOpen(true)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 mr-auto"
                    >
                      Đặt lại mật khẩu
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </Dialog.Panel>
          </div>
        </div>
        <ResetPasswordConfirmation />
      </Dialog>
    </Transition>
  );
};

export default EditUserModal;