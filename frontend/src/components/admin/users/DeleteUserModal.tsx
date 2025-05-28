import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationIcon } from '@heroicons/react/outline';
import type { User } from '@/types';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  user: User | null;
}

const DeleteUserModal = ({ isOpen, onClose, onConfirm, user }: DeleteUserModalProps) => {
  if (!user) return null;
  const handleDelete = async () => {
    try {
      await onConfirm(user._id || user.id || '');
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
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
            <Dialog.Panel className="w-full max-w-md bg-white rounded-xl shadow-2xl">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <ExclamationIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-medium">
                      Xác nhận xóa người dùng
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 mt-1">
                      Bạn có chắc chắn muốn xóa người dùng "{user.fullName}" không? 
                      Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Xóa
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

export default DeleteUserModal;
