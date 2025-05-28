import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, MapPin, Clock, Users, FileText, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import notificationService from '../services/notificationService';
import departmentService from '../services/departmentService';
import uploadService from '../services/uploadService';
import EventDaysSelector from './EventDaysSelector';
import SupportScheduleSelector from './SupportScheduleSelector';

interface CreateCommunityEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
  communityId: string;
  communityName: string;
}

interface Session {
  type: 'morning' | 'afternoon' | 'evening' | 'custom';
  startTime: string;
  endTime: string;
  label: string;
}

interface EventDay {
  date: Date;
  sessions: Session[];
}

interface SupportDay {
  date: Date;
  sessions: Session[];
}

interface FormData {
  title: string;
  description: string;
  eventDays: EventDay[];
  eventType: 'offline' | 'online' | 'hybrid';
  location: {
    physical: string;
    online: string;
  };
  category: string;
  department: string;
  visibility: 'public' | 'private';
  capacity: string;
  isRegistrationRequired: boolean;
  registrationDeadline: string;
  needsRegistrationForm: boolean;
  needsCollaboratorForm: boolean;
  maxCollaborators: string;
  images: File[];
  tags: string[];
  supportSchedule: SupportDay[];
}

const initialFormData: FormData = {
  title: '',
  description: '',
  eventDays: [],
  eventType: 'offline',
  location: {
    physical: '',
    online: ''
  },
  category: 'academic',
  department: '',
  visibility: 'public',
  capacity: '',
  isRegistrationRequired: true,
  registrationDeadline: '',
  needsRegistrationForm: false,
  needsCollaboratorForm: false,
  maxCollaborators: '',
  images: [],
  tags: [],
  supportSchedule: []
};

const CreateCommunityEventModal: React.FC<CreateCommunityEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  communityId,
  communityName
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{public_id: string, url: string}>>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [departments, setDepartments] = useState<Array<{_id: string, name: string}>>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setUploadedImages([]);
      setCurrentTag('');
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('location.')) {
      const locationKey = name.split('.')[1] as 'physical' | 'online';
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [locationKey]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Set files for preview and fallback
      setFormData(prev => ({ ...prev, images: files }));
      
      // Try to pre-upload images
      if (files.length > 0) {
        setImageUploadLoading(true);
        try {
          console.log('Pre-uploading images for community event...');
          console.log('Files to upload:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
          
          const uploadResults = await uploadService.uploadCommunityEventImages(files);
          console.log('Upload results:', uploadResults);
          
          if (uploadResults && uploadResults.length > 0) {
            setUploadedImages(uploadResults);
            console.log('Images uploaded successfully:', uploadResults.length);
          } else {
            console.warn('Upload returned empty results, will use direct upload');
            setUploadedImages([]);
          }
        } catch (error: any) {
          console.warn('Pre-upload failed, will use direct upload:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
          });
          // Reset uploaded images so direct upload will be used
          setUploadedImages([]);
        } finally {
          setImageUploadLoading(false);
        }
      }
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    
    // Also remove from formData.images if same index
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleEventDaysChange = (eventDays: EventDay[]) => {
    setFormData(prev => ({ ...prev, eventDays }));
  };

  const handleSupportScheduleChange = (schedule: SupportDay[]) => {
    setFormData(prev => ({ ...prev, supportSchedule: schedule }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.department || formData.eventDays.length === 0) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      // Validate that each event day has at least one session
      const hasInvalidDays = formData.eventDays.some(day => day.sessions.length === 0);
      if (hasInvalidDays) {
        alert('Mỗi ngày sự kiện phải có ít nhất một buổi');
        return;
      }

      // Create FormData for submission
      const submitData = new FormData();
      
      // Basic fields
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('eventType', formData.eventType);
      submitData.append('category', formData.category);
      submitData.append('department', formData.department);
      submitData.append('visibility', formData.visibility);
      submitData.append('capacity', formData.capacity);
      submitData.append('isRegistrationRequired', formData.isRegistrationRequired.toString());
      submitData.append('needsRegistrationForm', formData.needsRegistrationForm.toString());
      submitData.append('needsCollaboratorForm', formData.needsCollaboratorForm.toString());
      submitData.append('needsVolunteers', formData.needsCollaboratorForm.toString());
      submitData.append('maxCollaborators', formData.maxCollaborators);
      
      // Add organizer (current user)
      if (user?._id) {
        submitData.append('organizer', user._id);
      }
      
      // Location - handle different event types
      const location: any = {};
      if (formData.eventType === 'offline' || formData.eventType === 'hybrid') {
        if (formData.location.physical) {
          location.physical = { address: formData.location.physical };
        }
      }
      if (formData.eventType === 'online' || formData.eventType === 'hybrid') {
        if (formData.location.online) {
          location.online = { 
            platform: 'Custom',
            meetingLink: formData.location.online 
          };
        }
      }
      submitData.append('location', JSON.stringify(location));
      
      // Registration deadline
      if (formData.registrationDeadline) {
        submitData.append('registrationDeadline', formData.registrationDeadline);
      }

      // Event days
      if (formData.eventDays.length > 0) {
        submitData.append('eventDays', JSON.stringify(formData.eventDays.map(day => ({
          date: day.date.toISOString(),
          sessions: day.sessions
        }))));
      }

      // Tags
      if (formData.tags.length > 0) {
        submitData.append('tags', JSON.stringify(formData.tags));
      }

      // Support schedule
      if (formData.supportSchedule.length > 0) {
        submitData.append('setupTime', JSON.stringify({
          supportDays: formData.supportSchedule.map(day => ({
            date: day.date.toISOString(),
            sessions: day.sessions
          }))
        }));
      }

      // Handle images - prioritize pre-uploaded images, fallback to direct upload
      console.log('=== FRONTEND IMAGES PROCESSING ===');
      console.log('Processing images for community event:', {
        uploadedImagesCount: uploadedImages.length,
        formImagesCount: formData.images.length,
        uploadedImages: uploadedImages,
        formImages: formData.images.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      if (uploadedImages.length > 0) {
        // Use pre-uploaded images
        console.log('Using pre-uploaded images:', uploadedImages.length);
        uploadedImages.forEach((image, index) => {
          console.log(`Adding pre-uploaded image ${index}:`, image);
          submitData.append(`images[${index}][public_id]`, image.public_id);
          submitData.append(`images[${index}][url]`, image.url);
        });
        console.log('Pre-uploaded images added to FormData');
      } else if (formData.images.length > 0) {
        // Fallback to direct upload
        console.log('Using direct upload for images:', formData.images.length);
        formData.images.forEach((file, index) => {
          console.log(`Adding file ${index} for direct upload:`, {
            name: file.name, 
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          });
          submitData.append('eventImages', file);
        });
        console.log('Files added to FormData for direct upload');
      } else {
        console.log('No images to process');
      }

      // Debug FormData contents
      console.log('=== FORMDATA DEBUG ===');
      console.log('FormData keys:', Array.from(submitData.keys()));
      
      // Count how many images are being sent
      const imageKeys = Array.from(submitData.keys()).filter(key => 
        key.startsWith('images[') || key === 'eventImages'
      );
      console.log('Image-related keys in FormData:', imageKeys);
      
      // Check if eventImages files are properly attached
      const eventImageFiles = submitData.getAll('eventImages');
      console.log('EventImages files in FormData:', eventImageFiles.length);
      eventImageFiles.forEach((file, index) => {
        if (file instanceof File) {
          console.log(`EventImages file ${index}:`, {
            name: file.name,
            size: file.size,
            type: file.type
          });
        }
      });

      console.log('Submitting community event data:', {
        communityId,
        totalImagesProcessed: uploadedImages.length || formData.images.length,
        submissionMethod: uploadedImages.length > 0 ? 'pre-uploaded' : 'direct-upload'
      });

      // Create community event
      const result = await eventService.createCommunityEvent(communityId, submitData);
      
      console.log('Community event creation result:', result);
      
      if (result && result.success) {
        alert('Tạo sự kiện thành công!');
        onEventCreated();
        onClose();
      } else {
        throw new Error(result?.message || 'Không thể tạo sự kiện');
      }
    } catch (error: any) {
      console.error('Error creating community event:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Có lỗi xảy ra khi tạo sự kiện';
      
      if (error.response?.status === 500) {
        errorMessage = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Không tìm thấy cộng đồng.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền tạo sự kiện trong cộng đồng này.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Tạo sự kiện trong {communityName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Community Event Visibility */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="text-blue-600" size={20} />
              <h3 className="font-semibold text-blue-800">Cài đặt sự kiện cộng đồng</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Khả năng hiển thị</label>
                <select
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="public">Công khai (Mọi người đều thấy)</option>
                  <option value="private">Riêng tư (Chỉ thành viên cộng đồng)</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {formData.visibility === 'public' 
                    ? 'Sự kiện sẽ hiển thị trên trang chủ và có thể tìm kiếm được'
                    : 'Sự kiện chỉ hiển thị cho thành viên của cộng đồng này'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tên sự kiện <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="academic">Học thuật</option>
                <option value="cultural">Văn hóa</option>
                <option value="sports">Thể thao</option>
                <option value="workshop">Workshop</option>
                <option value="career">Nghề nghiệp</option>
                <option value="seminar">Hội thảo</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Khoa <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn khoa</option>
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Event Days */}
          <EventDaysSelector
            eventDays={formData.eventDays}
            onChange={handleEventDaysChange}
          />

          {/* Event Type and Location */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Hình thức tổ chức</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="offline">Trực tiếp</option>
                <option value="online">Trực tuyến</option>
                <option value="hybrid">Kết hợp</option>
              </select>
            </div>

            {(formData.eventType === 'offline' || formData.eventType === 'hybrid') && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1">
                  <MapPin size={16} />
                  Địa điểm
                </label>
                <input
                  type="text"
                  name="location.physical"
                  value={formData.location.physical}
                  onChange={handleInputChange}
                  placeholder="Nhập địa điểm tổ chức"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {(formData.eventType === 'online' || formData.eventType === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium mb-1">Link tham gia trực tuyến</label>
                <input
                  type="url"
                  name="location.online"
                  value={formData.location.online}
                  onChange={handleInputChange}
                  placeholder="https://meet.google.com/..."
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Capacity and Registration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-1">
                <Users size={16} />
                Sức chứa
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="0 = Không giới hạn"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hạn đăng ký</label>
              <input
                type="datetime-local"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Support Schedule */}
          {formData.needsCollaboratorForm && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lịch hỗ trợ</h3>
              <SupportScheduleSelector
                supportDays={formData.supportSchedule}
                onChange={handleSupportScheduleChange}
              />
            </div>
          )}

          {/* Additional Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isRegistrationRequired"
                checked={formData.isRegistrationRequired}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm">Yêu cầu đăng ký tham gia</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="needsRegistrationForm"
                checked={formData.needsRegistrationForm}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm">Tạo form đăng ký tùy chỉnh</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="needsCollaboratorForm"
                checked={formData.needsCollaboratorForm}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm">Cần tình nguyện viên hỗ trợ</label>
            </div>

            {formData.needsCollaboratorForm && (
              <div className="ml-6">
                <label className="block text-sm font-medium mb-1">Số lượng tình nguyện viên tối đa</label>
                <input
                  type="number"
                  name="maxCollaborators"
                  value={formData.maxCollaborators}
                  onChange={handleInputChange}
                  placeholder="0 = Không giới hạn"
                  className="w-32 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Nhập tag"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Thêm
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Image Upload with Preview */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <Upload size={16} />
              Hình ảnh sự kiện
            </label>
            
            {/* Upload Input */}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={imageUploadLoading}
            />
            
            {imageUploadLoading && (
              <p className="text-sm text-blue-600 mt-1 flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Đang tải lên hình ảnh...
              </p>
            )}
            
            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-green-600 mb-2">
                  ✓ Đã tải lên {uploadedImages.length} hình ảnh
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeUploadedImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {formData.images.length > 0 && uploadedImages.length === 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Đã chọn {formData.images.length} hình ảnh (sẽ upload khi tạo sự kiện)
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading || imageUploadLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading || imageUploadLoading}
            >
              {loading ? 'Đang tạo...' : imageUploadLoading ? 'Đang tải ảnh...' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityEventModal; 