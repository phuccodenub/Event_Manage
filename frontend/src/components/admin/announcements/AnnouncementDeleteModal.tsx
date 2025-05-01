import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { ExclamationIcon } from '@heroicons/react/outline';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string; // Chỉ cần truyền title thôi
}

const AnnouncementDeleteModal = ({ isOpen, onClose, onConfirm, title }: Props) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Có lỗi xảy ra khi xóa thông báo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex flex-col items-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <ExclamationIcon className="h-6 w-6 text-red-600" />
                </div>

                <Dialog.Title className="mt-4 text-lg font-medium text-gray-900">
                  Xác nhận xóa thông báo
                </Dialog.Title>

                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa thông báo{' '}
                    <span className="font-medium text-gray-900">
                      "{title}"
                    </span>
                    {' '}không?
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Hành động này không thể hoàn tác.
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isDeleting}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isDeleting ? 'Đang xóa...' : 'Xóa thông báo'}
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

export default AnnouncementDeleteModal;
