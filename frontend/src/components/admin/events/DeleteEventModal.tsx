import { useEvents } from '@/context/EventContext';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationIcon } from '@heroicons/react/outline';
import { Fragment, useState } from 'react';
import type { Event } from '@/types';
import eventService from '@/services/eventService';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

const DeleteEventModal = ({ isOpen, onClose, event }: Props) => {
  const { deleteEvent } = useEvents();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!event?._id) return;
    
    try {
      setIsDeleting(true);
      await eventService.deleteEvent(event._id);
      
      // Đầu tiên cập nhật UI thông qua context
      deleteEvent(event._id);
      
      // Sau đó đóng modal và hiển thị thông báo
      onClose();
      toast.success('Xóa sự kiện thành công');
      
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa sự kiện');
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
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                  <ExclamationIcon className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">
                    Xóa sự kiện
                  </Dialog.Title>
                  <p className="mt-1 text-sm text-gray-500">
                    Bạn có chắc chắn muốn xóa sự kiện "{event?.title}"? Hành động này không thể hoàn tác.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 
                    hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 
                    focus:ring-offset-2 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white 
                    hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 
                    focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang xóa...
                    </>
                  ) : (
                    'Xóa'
                  )}
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DeleteEventModal;
