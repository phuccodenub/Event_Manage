import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import type { Event } from '@/types';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, eventData: any) => Promise<void>;
  event: Event | null;
}

const EditEventModal = ({ isOpen, onClose, onSubmit, event }: EditEventModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    eventType: 'offline' as 'offline' | 'online' | 'hybrid',
    category: '',
    department: '',
    location: {
      physical: {
        address: '',
        room: ''
      },
      online: {
        platform: 'zoom',
        meetingLink: ''
      }
    },
    capacity: 0,
    images: [] as any[]
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        eventType: event.eventType || 'offline',
        category: event.category || '',
        department: event.department?._id || '',
        location: {
          physical: {
            address: event.location?.physical?.address || '',
            room: event.location?.physical?.room || ''
          },
          online: {
            platform: event.location?.online?.platform || 'zoom',
            meetingLink: event.location?.online?.meetingLink || ''
          }
        },
        capacity: event.capacity || 0,
        images: event.images || []
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?._id) return;

    try {
      await onSubmit(event._id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  if (!event) return null;

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
            <Dialog.Panel className="w-full max-w-4xl transform rounded-xl bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Chỉnh sửa sự kiện
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên sự kiện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      required
                    />
                  </div>
                </div>

                {/* Event Type and Location */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hình thức <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.eventType}
                      onChange={e => setFormData(prev => ({ ...prev, eventType: e.target.value as 'offline' | 'online' | 'hybrid' }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="offline">Trực tiếp</option>
                      <option value="online">Trực tuyến</option>
                      <option value="hybrid">Kết hợp</option>
                    </select>
                  </div>

                  {/* Location fields based on event type */}
                  {/* ... additional form fields ... */}
                </div>

                <div className="pt-6 border-t flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                  >
                    Cập nhật
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditEventModal;
