import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { Event } from '../../types';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventId: string, eventData: FormData) => Promise<void>;
  event: Event | null;
}

const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, onSubmit, event }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    eventType: 'offline',
    location: {
      physical: { address: '', room: '' },
      online: { platform: '', meetingLink: '' }
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,        startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        eventType: event.eventType,
        location: {
          physical: event.location?.physical || { address: '', room: '' },
          online: event.location?.online || { platform: '', meetingLink: '' }
        }
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setIsSubmitting(true);
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('description', formData.description);
      formDataToSubmit.append('startDate', formData.startDate);
      formDataToSubmit.append('endDate', formData.endDate);
      formDataToSubmit.append('eventType', formData.eventType);
      formDataToSubmit.append('location', JSON.stringify(formData.location));

      await onSubmit(event._id, formDataToSubmit);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg w-full max-w-2xl mx-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <IoClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Form fields similar to CreateEventModal but simplified */}
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Event Title"
            className="w-full p-2 border rounded"
            required
          />
          
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Event Description"
            className="w-full p-2 border rounded min-h-[100px]"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
