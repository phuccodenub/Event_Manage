import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { AdminAnnouncement } from '@/types/admin';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  announcement: AdminAnnouncement;
}

const AnnouncementViewModal = ({ isOpen, onClose, announcement }: Props) => {
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
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Chi tiết thông báo
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900">{announcement.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                      <span>
                        Người tạo: {announcement.creator.fullName}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(announcement.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                      </span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{announcement.content}</p>
                  </div>

                  {announcement.images?.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {announcement.images.map((image, index) => (
                        <img
                          key={index}
                          src={image.url}
                          alt=""
                          className="rounded-lg object-cover w-full aspect-video"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium
                      ${announcement.category === 'academic' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {announcement.category === 'academic' ? 'Học vụ' : 'Chung'}
                    </span>
                    <span>•</span>
                    <span>
                      Hết hạn: {format(new Date(announcement.expiresAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AnnouncementViewModal;
