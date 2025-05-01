import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon, CalendarIcon, LocationMarkerIcon, UserGroupIcon } from '@heroicons/react/outline';
import type { Event } from '@/types';

const IMAGE_SECTION_WIDTH = 700; // Tăng từ 600 lên 800
const CONTENT_SECTION_WIDTH = 600; // Tăng từ 500 lên 600

interface EventViewModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventViewModal = ({ event, isOpen, onClose }: EventViewModalProps) => {
  const [currentImage, setCurrentImage] = useState(0);

  if (!event) return null;

  const hasImages = event.images && Array.isArray(event.images) && event.images.length > 0;
  const modalWidth = hasImages ? IMAGE_SECTION_WIDTH + CONTENT_SECTION_WIDTH : CONTENT_SECTION_WIDTH;
  
  // Reset current image if no images available
  if (!hasImages && currentImage !== 0) {
    setCurrentImage(0);
  }

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
            <Dialog.Panel 
              className="bg-white rounded-xl shadow-2xl overflow-hidden"
              style={{ width: modalWidth }}
            >
              <div className="flex h-[600px]">
                {/* Image Section - Only render if has images */}
                {hasImages && (
                  <div style={{ width: IMAGE_SECTION_WIDTH }} className="border-r border-gray-100">
                    <div className="p-6 h-7/8">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 w-full h-full">
                        {event.images && event.images[currentImage] ? (
                          <img
                            src={event.images[currentImage].url}
                            alt={event.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <CalendarIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {hasImages && event.images.length > 1 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar">
                          {event.images.map((image, idx) => (
                            <button
                              key={idx}
                              className={`flex-shrink-0 w-20 aspect-video rounded-md overflow-hidden border-2 
                                ${currentImage === idx ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}
                              onClick={() => setCurrentImage(idx)}
                            >
                              <img
                                src={image.url}
                                alt={`${event.title} ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Section - Fixed width */}
                <div style={{ width: CONTENT_SECTION_WIDTH }} className="flex-shrink-0 flex flex-col">
                  {/* Main Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="relative p-6">
                      <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100"
                      >
                        <XIcon className="w-5 h-5" />
                      </button>

                      <Dialog.Title className="text-2xl font-bold text-gray-900 pr-8">
                        {event.title}
                      </Dialog.Title>

                      <div className="space-y-4">

                        <div className="pt-2">
                          {/* <h3 className="font-semibold text-gray-900">Mô tả</h3> */}
                          <p className="text-gray-600 whitespace-pre-line">
                            {event.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <CalendarIcon className="w-5 h-5" />
                          <span>
                            {new Date(event.startDate).toLocaleString('vi-VN', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <LocationMarkerIcon className="w-5 h-5" />
                          <span>
                            {event.location?.physical 
                              ? `${event.location.physical.address}${event.location.physical.room ? ` - ${event.location.physical.room}` : ''}`
                              : event.location?.online?.platform || 'Online'}
                          </span>
                        </div>

                        {event.department && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <UserGroupIcon className="w-5 h-5" />
                            <span>{event.department.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Participation Info - Fixed at bottom */}
                  <div className="border-t border-gray-100">
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2">Thông tin tham gia</h3>
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-500">Số người tham gia</div>
                          <div className="text-lg font-semibold">
                            {event.participants?.length || 0}/{event.capacity || '∞'}
                          </div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                            event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status === 'upcoming' ? 'Sắp diễn ra' :
                             event.status === 'ongoing' ? 'Đang diễn ra' :
                             'Đã hoàn thành'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EventViewModal;
