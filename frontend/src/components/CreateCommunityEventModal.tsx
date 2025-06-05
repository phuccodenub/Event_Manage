import React, { useState, useEffect } from 'react';
import { X, Upload, Calendar, MapPin, Clock, Users, FileText, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import notificationService from '../services/notificationService';
import departmentService from '../services/departmentService';
import uploadService from '../services/uploadService';
import EventDaysSelector from './EventDaysSelector';
import SupportScheduleSelector from './SupportScheduleSelector';
import { toast } from 'react-toastify';

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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [departments, setDepartments] = useState<Array<{_id: string, name: string}>>([]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData);
      setSelectedImages([]);
      setPreviews([]);
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

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const filesArray = Array.from(files);
      setSelectedImages(prev => [...prev, ...filesArray]);
      
      filesArray.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
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
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        setLoading(false);
        return;
      }

      // Validate that each event day has at least one session
      const hasInvalidDays = formData.eventDays.some(day => day.sessions.length === 0);
      if (hasInvalidDays) {
        toast.error('Mỗi ngày sự kiện phải có ít nhất một buổi');
        setLoading(false);
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
      submitData.append('community', communityId);
      
      // Add organizer (current user)
      if (user?._id) {
        submitData.append('organizer', user._id);
      }

      // Handle capacity
      if (formData.capacity && parseInt(formData.capacity) > 0) {
        submitData.append('capacity', formData.capacity.toString());
      }

      // Handle max collaborators
      if (formData.maxCollaborators && parseInt(formData.maxCollaborators) > 0) {
        submitData.append('maxVolunteers', formData.maxCollaborators.toString());
      }

      // Handle registration deadline
      if (formData.registrationDeadline) {
        submitData.append('registrationDeadline', formData.registrationDeadline);
      }
      
      // Location - handle different event types
      const location: any = {};
      if (formData.eventType === 'offline' || formData.eventType === 'hybrid') {
        if (!formData.location.physical) {
          toast.error('Vui lòng nhập địa chỉ cho sự kiện trực tiếp');
          return;
        }
        location.physical = { address: formData.location.physical };
      }
      if (formData.eventType === 'online' || formData.eventType === 'hybrid') {
        if (!formData.location.online) {
          toast.error('Vui lòng nhập đầy đủ thông tin cho sự kiện trực tuyến');
          return;
        }
        location.online = { 
          platform: 'Custom',
          meetingLink: formData.location.online 
        };
      }
      submitData.append('location', JSON.stringify(location));

      // Event days
      if (formData.eventDays.length > 0) {
        submitData.append('eventDays', JSON.stringify(formData.eventDays.map(day => ({
          date: day.date.toISOString(),
          sessions: day.sessions
        }))));
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

      // Handle images like CreateEventModal
      if (selectedImages.length > 0) {
        try {
          toast.info('Đang tải ảnh lên...');
          const uploadedFiles = await uploadService.uploadEventImages(selectedImages);
          
          if (!uploadedFiles || uploadedFiles.length === 0) {
            throw new Error('Không có ảnh nào được tải lên thành công');
          }
          
          uploadedFiles.forEach((image, index) => {
            if (image && image.public_id && image.url) {
              submitData.append(`images[${index}][public_id]`, image.public_id);
              submitData.append(`images[${index}][url]`, image.url);
            }
          });
          
          toast.success(`Đã tải lên ${uploadedFiles.length} ảnh thành công`);
        } catch (uploadError: any) {
          console.error('Error uploading images:', uploadError);
          
          // If it's a server connection error, allow user to proceed without images
          if (uploadError.message?.includes('không sẵn sàng') || uploadError.message?.includes('kết nối')) {
            const proceed = window.confirm(
              'Không thể tải ảnh lên do lỗi kết nối server. Bạn có muốn tạo sự kiện không có ảnh không?'
            );
            if (proceed) {
              toast.warning('Tạo sự kiện không có ảnh');
              // Continue without images
            } else {
              setLoading(false);
              return;
            }
          } else {
            toast.error('Có lỗi khi tải ảnh lên. Vui lòng thử lại.');
            setLoading(false);
            return;
          }
        }
      }

      // Add registration form data
      submitData.append('needsRegistrationForm', formData.needsRegistrationForm ? 'true' : 'false');
      submitData.append('formFields', JSON.stringify([]));

      // Add collaborator form data
      submitData.append('needsCollaboratorForm', formData.needsCollaboratorForm ? 'true' : 'false');
      submitData.append('needsVolunteers', formData.needsCollaboratorForm ? 'true' : 'false');

      console.log('Submitting community event data:', {
        communityId,
        formDataEntries: Array.from(submitData.entries())
      });

      // Create community event
      const result = await eventService.createCommunityEvent(communityId, submitData);
      
      console.log('Community event creation result:', result);
      
      if (result && result.success) {
        toast.success('Tạo sự kiện thành công!');
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
      
      toast.error(errorMessage);
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

          {/* Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-1">
              <Upload size={16} />
              Hình ảnh sự kiện
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {selectedImages.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-2">
                  Đã chọn {selectedImages.length} hình ảnh
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityEventModal; 