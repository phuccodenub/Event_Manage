import React, { useState, useCallback, useEffect } from 'react';
import { IoClose, IoImage } from 'react-icons/io5';
import { MdImage } from 'react-icons/md';
import { BiCalendarEvent } from 'react-icons/bi';
import { IoLocationOutline } from 'react-icons/io5';
import uploadService, { UploadedFile } from '../../services/uploadService';
import eventService from '../../services/eventService';
import announcementService from '../../services/announcementService';
import notificationService from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  isLoading?: boolean;
  error?: string | null;
}

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  eventType: 'offline' | 'online' | 'hybrid';
  category: string;
  department: string;
  organizer: string;
  location: {
    physical: { address: string; room: string };
    online: { platform: string; meetingLink: string };
  };
  image: File | null;
  images: Array<{
    public_id: string;
    url: string;
  }>;
  postType: 'event' | 'announcement';
  priority?: number;
  expiresAt?: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    eventType: 'offline',
    category: '',
    department: '',
    organizer: user?._id || '', // Use authenticated user's ID
    location: {
      physical: { address: '', room: '' },
      online: { platform: '', meetingLink: '' }
    },
    image: null,
    images: [],
    postType: 'event',
    priority: 0,
    expiresAt: '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImagePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          addNewImage(file);
        }
      }
    }
  }, []);

  const addNewImage = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    document.addEventListener('paste', handleImagePaste);
    return () => document.removeEventListener('paste', handleImagePaste);
  }, [handleImagePaste]);

  useEffect(() => {
    if (user?._id) {
      setFormData(prev => ({ ...prev, organizer: user._id }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      if (formData.postType === 'announcement') {
        // Map các trường cho đúng với model Announcement
        const announcementData = {
          title: formData.title,
          content: formData.description, // Map description sang content
          category: formData.category,
          priority: formData.priority || 0,
          department: formData.department,
          expiresAt: formData.expiresAt,
          images: formData.images
        };

        const createdAnnouncement = await announcementService.createAnnouncement(announcementData);
        console.log('Announcement created:', createdAnnouncement);

        // Thông báo sau khi tạo announcement thành công
        try {
          await notificationService.createMassNotification({
            recipients: ['all'],
            type: 'new_announcement',
            title: 'Thông báo mới',
            message: `Một thông báo mới "${formData.title}" đã được đăng`,
            relatedModel: 'Announcement',
            relatedId: createdAnnouncement._id,
            link: `/announcements/${createdAnnouncement._id}`
          });
        } catch (notifError) {
          console.error('Notification error:', notifError);
        }
      } else {
        const formDataToSubmit = new FormData();

        // Handle event creation
        formDataToSubmit.append('title', formData.title);
        formDataToSubmit.append('description', formData.description);
        formDataToSubmit.append('category', formData.category);
        formDataToSubmit.append('department', formData.department);
        formDataToSubmit.append('startDate', formData.startDate);
        formDataToSubmit.append('endDate', formData.endDate);
        formDataToSubmit.append('eventType', formData.eventType);
        formDataToSubmit.append('organizer', user?._id || '');

        const location = {
          ...(formData.eventType !== 'online' ? { 
            physical: formData.location.physical 
          } : {}),
          ...(formData.eventType !== 'offline' ? { 
            online: {
              platform: formData.location.online.platform || 'other',
              meetingLink: formData.location.online.meetingLink
            }
          } : {})
        };
        formDataToSubmit.append('location', JSON.stringify(location));

        if (selectedFiles.length > 0) {
          try {
            const uploadedFiles = await uploadService.uploadEventImages(selectedFiles);
            uploadedFiles.forEach((image, index) => {
              formDataToSubmit.append(`images[${index}][public_id]`, image.public_id);
              formDataToSubmit.append(`images[${index}][url]`, image.url);
            });
          } catch (uploadError) {
            console.error('Error uploading images:', uploadError);
            throw new Error('Failed to upload images');
          }
        }

        const newEvent = await eventService.createEvent(formDataToSubmit);
        
        // Gửi thông báo sau khi tạo event thành công
        await notificationService.createMassNotification({
          recipients: ['all'], // hoặc một array của user IDs cụ thể
          type: 'new_event',
          title: 'Sự kiện mới',
          message: `Một sự kiện mới "${formData.title}" đã được tạo`,
          relatedModel: 'Event',
          relatedId: newEvent._id,
          link: `/events/${newEvent._id}`
        });
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.response?.data?.message || 'Error creating post');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      eventType: 'offline',
      category: '',
      department: '',
      priority: 0,
      expiresAt: '',
      postType: 'event',
      location: {
        physical: { address: '', room: '' },
        online: { platform: '', meetingLink: '' }
      },
      image: null,
      images: [],
    });
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="relative bg-white rounded-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create {formData.postType === 'event' ? 'Event' : 'Announcement'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {user?.role === 'admin' && (
            <select
              className="w-full p-2 border rounded"
              value={formData.postType}
              onChange={(e) => setFormData({ ...formData, postType: e.target.value as 'event' | 'announcement' })}
            >
              <option value="event">Create Event</option>
              <option value="announcement">Create Announcement</option>
            </select>
          )}

          {formData.postType === 'announcement' ? (
            <>
              <input
                type="text"
                placeholder="Announcement Title *"
                className="w-full text-lg font-semibold p-2 border rounded"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              
              <textarea
                placeholder="Announcement Content *"
                className="w-full min-h-[120px] p-2 border rounded"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <select
                  required
                  className="p-2 border rounded"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category *</option>
                  <option value="general">General</option>
                  <option value="academic">Academic</option>
                  <option value="event">Event</option>
                  <option value="news">News</option>
                  <option value="urgent">Urgent</option>
                </select>

                <input
                  type="number"
                  min="0"
                  max="5"
                  placeholder="Priority (0-5)"
                  className="p-2 border rounded"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                />
              </div>

              <input
                type="datetime-local"
                required
                className="w-full p-2 border rounded"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                placeholder="Expiry Date *"
              />

              <select
                required
                className="p-2 border rounded"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="">Select Department *</option>
                <option value="64f7125708d7c35d8354154f">Computer Science</option>
                <option value="64f7125708d7c35d83541550">Information Technology</option>
                <option value="64f7125708d7c35d83541551">Software Engineering</option>
              </select>
            </>
          ) : (
            <>
              <input
                type="text"
                placeholder="Event Title"
                className="w-full text-lg font-semibold mb-4 p-2 border-none focus:outline-none"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              
              <textarea
                placeholder="What's this event about?"
                className="w-full min-h-[120px] p-2 border-none focus:outline-none resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <select
                  required
                  className="p-2 border rounded"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select Category *</option>
                  <option value="academic">Academic</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="other">Other</option>
                </select>

                <select
                  required
                  className="p-2 border rounded"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">Select Department *</option>
                  <option value="64f7125708d7c35d8354154f">Computer Science</option>
                  <option value="64f7125708d7c35d83541550">Information Technology</option>
                  <option value="64f7125708d7c35d83541551">Software Engineering</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <input
                  type="datetime-local"
                  required
                  className="p-2 border rounded"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  placeholder="Start Date *"
                />
                <input
                  type="datetime-local"
                  required
                  className="p-2 border rounded"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  placeholder="End Date *"
                />
              </div>
              
              <div className="mt-4 space-y-3">
                <select
                  className="w-full p-2 border rounded"
                  value={formData.eventType}
                  onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                >
                  <option value="offline">Offline Event</option>
                  <option value="online">Online Event</option>
                  <option value="hybrid">Hybrid Event</option>
                </select>

                {(formData.eventType === 'offline' || formData.eventType === 'hybrid') && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Physical Address *"
                      className="w-full p-2 border rounded"
                      value={formData.location.physical.address}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          physical: { ...formData.location.physical, address: e.target.value }
                        }
                      })}
                    />
                    <input
                      type="text"
                      placeholder="Room Number"
                      className="w-full p-2 border rounded"
                      value={formData.location.physical.room}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          physical: { ...formData.location.physical, room: e.target.value }
                        }
                      })}
                    />
                  </div>
                )}

                {(formData.eventType === 'online' || formData.eventType === 'hybrid') && (
                  <div className="space-y-2">
                    <select
                      className="w-full p-2 border rounded"
                      value={formData.location.online.platform}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          online: { ...formData.location.online, platform: e.target.value }
                        }
                      })}
                    >
                      <option value="">Select Platform *</option>
                      <option value="zoom">Zoom</option>
                      <option value="google-meet">Google Meet</option>
                      <option value="microsoft-teams">Microsoft Teams</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Meeting Link *"
                      className="w-full p-2 border rounded"
                      value={formData.location.online.meetingLink}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          online: { ...formData.location.online, meetingLink: e.target.value }
                        }
                      })}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer">
                  <IoImage className="text-gray-600" />
                  <span>Thêm ảnh</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach(addNewImage);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500">hoặc dán ảnh (Ctrl+V)</span>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                        setPreviews(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IoClose className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 mt-4">
            <p className="text-sm font-semibold mb-2">Add to your post</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => document.getElementById('image-input')?.click()}
              >
                <MdImage size={24} className="text-green-600" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => document.getElementById('date-input')?.click()}
              >
                <BiCalendarEvent size={24} className="text-blue-600" />
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => document.getElementById('location-input')?.focus()}
              >
                <IoLocationOutline size={24} className="text-red-600" />
              </button>
            </div>
          </div>

          <input
            id="image-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFormData({ ...formData, image: e.target.files[0] });
              }
            }}
          />
          <input
            id="date-input"
            type="date"
            className="hidden"
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-4 p-3 ${
              formData.postType === 'announcement' 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-[#0A66C2] hover:bg-[#004182]'
            } text-white rounded-lg font-semibold 
              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''} 
              transition-colors flex items-center justify-center`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {formData.postType === 'announcement' ? 'Posting Announcement...' : 'Posting Event...'}
              </>
            ) : (
              formData.postType === 'announcement' ? 'Post Announcement' : 'Post Event'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
