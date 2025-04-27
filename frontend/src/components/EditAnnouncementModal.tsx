import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { Announcement } from '../types';

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (announcementId: string, data: FormData) => Promise<void>;
  announcement: Announcement | null;
}

const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({ 
  isOpen, onClose, onSubmit, announcement 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 0,
    expiresAt: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        priority: announcement.priority,
        expiresAt: new Date(announcement.expiresAt).toISOString().slice(0, 16)
      });
    }
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;

    setIsSubmitting(true);
    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('title', formData.title);
      formDataToSubmit.append('content', formData.content);
      formDataToSubmit.append('category', formData.category);
      formDataToSubmit.append('priority', formData.priority.toString());
      formDataToSubmit.append('expiresAt', formData.expiresAt);

      await onSubmit(announcement._id, formDataToSubmit);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg w-full max-w-2xl mx-4 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Announcement</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <IoClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Announcement Title"
            className="w-full p-2 border rounded"
            required
          />
          
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Announcement Content"
            className="w-full p-2 border rounded min-h-[100px]"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select Category</option>
              <option value="general">General</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="news">News</option>
              <option value="urgent">Urgent</option>
            </select>

            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              min="0"
              max="5"
              placeholder="Priority (0-5)"
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <input
            type="datetime-local"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Announcement'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditAnnouncementModal;
