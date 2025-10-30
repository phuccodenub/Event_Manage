import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XIcon, PhotographIcon, LocationMarkerIcon, ClockIcon } from '@heroicons/react/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import departmentService from '@/services/departmentService';
import uploadService from '@/services/uploadService';
import { motion } from 'framer-motion';
import type { Department } from '@/types';
import EventDaysSelector from '@/components/EventDaysSelector';
import SupportScheduleSelector from '@/components/SupportScheduleSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, eventData: any) => Promise<void>;
  event: Event | null;
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

interface Event {
  _id: string;
  title: string;
  description: string;
  category: string;
  department: Department;
  eventType: 'offline' | 'online' | 'hybrid';
  eventDays: {
    date: string;
    sessions: {
      type: string;
      startTime: string;
      endTime: string;
      label: string;
    }[];
  }[];
  setupTime?: {
    supportDays: {
      date: string;
      sessions: {
        type: string;
        startTime: string;
        endTime: string;
        label: string;
      }[];
    }[];
  };
  visibility: string;
  status: string;
  needsRegistrationForm?: boolean;
  needsCollaboratorForm?: boolean;
  maxVolunteers?: number;
  registrationDeadline?: string;
  location: string | {
    physical?: {
      address: string;
      room?: string;
    };
    online?: {
      platform: string;
      meetingLink: string;
    };
  };
  capacity?: number;
  organizer: {
    _id: string;
  };
  creator: string;
  participants: any[];
  collaborators: any[];
  speakers: any[];
  tags: any[];
  likes: any[];
  comments: any[];
  shares: any[];
  images?: any[];
}

const EVENT_TYPES = {
  offline: 'Trực tiếp',
  online: 'Trực tuyến',
  hybrid: 'Kết hợp'
};

const EVENT_CATEGORIES = {
  academic: 'Học thuật',
  cultural: 'Văn hóa',
  sports: 'Thể thao',
  workshop: 'Hội thảo',
  career: 'Việc làm',
  seminar: 'Thuyết trình',
  other: 'Khác'
};

const ONLINE_PLATFORMS = {
  'Zoom': 'Zoom',
  'Google Meet': 'Google Meet',
  'Microsoft Teams': 'Microsoft Teams',
  'Other': 'Khác'
};

const EditEventModal = ({ isOpen, onClose, onSubmit, event }: Props) => {
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [supportSchedule, setSupportSchedule] = useState<SupportDay[]>([]);

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm();
  const eventType = watch('eventType', event?.eventType || 'offline');

  useEffect(() => {
    if (event) {
      // Basic information
      setValue('title', event.title);
      setValue('description', event.description);
      setValue('category', event.category || '');
      setValue('department', event.department?._id);
      setValue('eventType', event.eventType);
      setValue('capacity', event.capacity);
      setValue('visibility', event.visibility);
      setValue('status', event.status);
      setValue('needsRegistrationForm', event.needsRegistrationForm);
      setValue('needsCollaboratorForm', event.needsCollaboratorForm);
      setValue('maxCollaborators', event.maxVolunteers);
      
      // Format registrationDeadline for datetime-local input
      if (event.registrationDeadline) {
        const deadline = new Date(event.registrationDeadline);
        const formattedDeadline = deadline.toISOString().slice(0, 16); // Format: "YYYY-MM-DDTHH:mm"
        setValue('registrationDeadline', formattedDeadline);
      }

      // Handle event days and sessions
      if (event.eventDays && event.eventDays.length > 0) {
        const formattedEventDays = event.eventDays.map(day => ({
          date: new Date(day.date),
          sessions: day.sessions.map(session => ({
            type: session.type as 'morning' | 'afternoon' | 'evening' | 'custom',
            startTime: session.startTime,
            endTime: session.endTime,
            label: session.label
          }))
        }));
        setEventDays(formattedEventDays);
      }

      // Handle support schedule
      if (event.setupTime?.supportDays) {
        const formattedSupportDays = event.setupTime.supportDays.map(day => ({
          date: new Date(day.date),
          sessions: day.sessions.map(session => ({
            type: session.type as 'morning' | 'afternoon' | 'evening' | 'custom',
            startTime: session.startTime,
            endTime: session.endTime,
            label: session.label
          }))
        }));
        setSupportSchedule(formattedSupportDays);
      }

      // Handle location based on type
      try {
        const locationData = typeof event.location === 'string' 
          ? JSON.parse(event.location) 
          : event.location;

        if (locationData?.physical) {
          setValue('physicalAddress', locationData.physical.address);
          setValue('physicalRoom', locationData.physical.room);
        }

        if (locationData?.online) {
          setValue('onlinePlatform', locationData.online.platform);
          setValue('meetingLink', locationData.online.meetingLink);
        }
      } catch (error) {
        console.error('Error parsing location:', error);
      }

      // Handle images
      if (event.images && Array.isArray(event.images)) {
        setExistingImages(event.images);
        setPreviews(event.images.map(img => img.url));
      }
    }
  }, [event, setValue]);

  const handleEventDaysChange = (newEventDays: EventDay[]) => {
    setEventDays(newEventDays);
  };

  const handleSupportScheduleChange = (newSupportSchedule: SupportDay[]) => {
    setSupportSchedule(newSupportSchedule);
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files);
    setSelectedImages(prev => [...prev, ...newImages]);
    setPreviews(prev => [...prev, ...newImages.map(file => URL.createObjectURL(file))]);
  };

  const removeImage = (index: number) => {
    if (index < existingImages.length) {
      // Remove from existing images
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // Remove from new images
      const newIndex = index - existingImages.length;
      setSelectedImages(prev => prev.filter((_, i) => i !== newIndex));
    }
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleImagePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setSelectedImages(prev => [...prev, file]);
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviews(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handleImagePaste);
    return () => {
      document.removeEventListener('paste', handleImagePaste);
    };
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Không thể tải danh sách khoa');
      }
    };

    fetchDepartments();
  }, []);

  const handleFormSubmit = async (data: any) => {
    if (!event?._id) return;

    try {
      setLoading(true);

      // Validate event days
      if (eventDays.length === 0) {
        toast.error('Vui lòng thêm ít nhất một ngày sự kiện');
        return;
      }

      // Validate that each event day has at least one session
      const hasInvalidDays = eventDays.some(day => day.sessions.length === 0);
      if (hasInvalidDays) {
        toast.error('Mỗi ngày sự kiện phải có ít nhất một buổi');
        return;
      }

      const formDataToSubmit = new FormData();

      // Basic event information
      formDataToSubmit.append('title', data.title.trim());
      formDataToSubmit.append('description', data.description.trim());
      formDataToSubmit.append('category', data.category);
      formDataToSubmit.append('department', data.department);
      formDataToSubmit.append('eventType', data.eventType);
      formDataToSubmit.append('visibility', 'public');
      formDataToSubmit.append('status', event.status);
      
      // Event days - Chuyển đổi thành chuỗi JSON
      const formattedEventDays = eventDays.map(day => ({
        date: day.date.toISOString(),
        sessions: day.sessions
      }));
      formDataToSubmit.append('eventDays', JSON.stringify(formattedEventDays));

      // Add support schedule if needed
      if (data.needsCollaboratorForm && supportSchedule.length > 0) {
        const formattedSupportDays = supportSchedule.map(day => ({
          date: day.date.toISOString(),
          sessions: day.sessions
        }));
        formDataToSubmit.append('setupTime', JSON.stringify({ 
          supportDays: formattedSupportDays
        }));
      }

      // Handle capacity
      if (data.capacity && parseInt(data.capacity) > 0) {
        formDataToSubmit.append('capacity', data.capacity.toString());
      }

      // Handle max collaborators
      if (data.maxCollaborators && parseInt(data.maxCollaborators) > 0) {
        formDataToSubmit.append('maxVolunteers', data.maxCollaborators.toString());
      }

      // Handle registration deadline
      if (data.registrationDeadline) {
        formDataToSubmit.append('registrationDeadline', data.registrationDeadline);
      }

      // Handle location based on event type
      const location: any = {};
      
      if (data.eventType === 'offline' || data.eventType === 'hybrid') {
        if (!data.physicalAddress) {
          toast.error('Vui lòng nhập địa chỉ cho sự kiện trực tiếp');
          return;
        }
        location.physical = {
          address: data.physicalAddress.trim(),
          room: data.physicalRoom ? data.physicalRoom.trim() : undefined
        };
      }

      if (data.eventType === 'online' || data.eventType === 'hybrid') {
        if (!data.meetingLink || !data.onlinePlatform) {
          toast.error('Vui lòng nhập đầy đủ thông tin cho sự kiện trực tuyến');
          return;
        }
        location.online = {
          platform: data.onlinePlatform,
          meetingLink: data.meetingLink.trim()
        };
      }

      formDataToSubmit.append('location', JSON.stringify(location));

      // Handle images
      let uploadedImages: any[] = [];
      if (selectedImages.length > 0) {
        try {
          uploadedImages = await uploadService.uploadEventImages(selectedImages);
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          toast.error('Có lỗi khi tải ảnh lên');
          return;
        }
      }
      
      // Add each field to FormData
      Object.entries({
        organizer: event.organizer._id,
        creator: event.creator,
        participants: event.participants || [],
        collaborators: event.collaborators || [],
        speakers: event.speakers || [],
        tags: event.tags || [],
        likes: event.likes || [],
        comments: event.comments || [],
        shares: event.shares || []
      }).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          formDataToSubmit.append(key, JSON.stringify(value));
        }
      });

      // Always send existingImages array, even if empty
      formDataToSubmit.append('existingImages', JSON.stringify(existingImages));

      // Append new uploaded images
      uploadedImages.forEach((image, index) => {
        formDataToSubmit.append(`images[${index}][public_id]`, image.public_id);
        formDataToSubmit.append(`images[${index}][url]`, image.url);
      });

      await onSubmit(event._id, formDataToSubmit);
      onClose();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!watch('title') || !watch('description') || !watch('category') || !watch('department')) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
      if (eventDays.length === 0) {
        toast.error('Vui lòng thêm ít nhất một ngày sự kiện');
        return;
      }
      const hasInvalidDays = eventDays.some(day => day.sessions.length === 0);
      if (hasInvalidDays) {
        toast.error('Mỗi ngày sự kiện phải có ít nhất một buổi');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepOne = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên sự kiện <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title', { required: 'Vui lòng nhập tên sự kiện' })}
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description', { required: 'Vui lòng nhập mô tả' })}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message as string}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Danh mục <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category', { required: 'Vui lòng chọn danh mục' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Chọn danh mục</option>
            {Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-500">{errors.category.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Khoa <span className="text-red-500">*</span>
          </label>
          <select
            {...register('department', { required: 'Vui lòng chọn khoa' })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="">Chọn khoa</option>
            {departments.map(dept => (
              <option key={dept._id} value={dept._id}>{dept.name}</option>
            ))}
          </select>
          {errors.department && (
            <p className="mt-1 text-sm text-red-500">{errors.department.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hình thức <span className="text-red-500">*</span>
          </label>
          <select
            {...register('eventType')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            {Object.entries(EVENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hạn chót đăng ký
        </label>
        <input
          {...register('registrationDeadline')}
          type="datetime-local"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Để trống nếu không có hạn chót đăng ký
        </p>
      </div>

      {/* Event Days Selector */}
      <EventDaysSelector
        eventDays={eventDays}
        onChange={handleEventDaysChange}
      />

      {/* Support Schedule Section */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center">
          <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
          Lịch hỗ trợ cho cộng tác viên
        </h3>
        <p className="text-sm text-blue-700 mb-4">
          Chọn các ngày và ca hỗ trợ mà cộng tác viên có thể đăng ký làm việc.
        </p>
        
        <SupportScheduleSelector 
          supportDays={supportSchedule}
          onChange={handleSupportScheduleChange}
        />
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
          type="button"
          onClick={goToNextStep}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-6">
      {(eventType === 'offline' || eventType === 'hybrid') && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Địa điểm</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <LocationMarkerIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/4" />
                <input
                  {...register('physicalAddress', { required: 'Vui lòng nhập địa chỉ' })}
                  type="text"
                  className="w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>
              {errors.physicalAddress && (
                <p className="mt-1 text-sm text-red-500">{errors.physicalAddress.message as string}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phòng</label>
              <input
                {...register('physicalRoom')}
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="Số phòng (nếu có)"
              />
            </div>
          </div>
        </div>
      )}

      {(eventType === 'online' || eventType === 'hybrid') && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Thông tin trực tuyến</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nền tảng <span className="text-red-500">*</span>
              </label>
              <select
                {...register('onlinePlatform', { required: 'Vui lòng chọn nền tảng' })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                {Object.entries(ONLINE_PLATFORMS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link meeting <span className="text-red-500">*</span>
              </label>
              <input
                {...register('meetingLink', { required: 'Vui lòng nhập link meeting' })}
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="https://..."
              />
              {errors.meetingLink && (
                <p className="mt-1 text-sm text-red-500">{errors.meetingLink.message as string}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng người tham gia tối đa
          </label>
          <input
            {...register('capacity')}
            type="number"
            min="1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder="Để trống = không giới hạn"
          />
          <p className="mt-1 text-xs text-gray-500">
            Để trống nếu không muốn giới hạn số người tham gia
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng tình nguyện viên tối đa
          </label>
          <input
            {...register('maxCollaborators')}
            type="number"
            min="1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            placeholder="Để trống = không giới hạn"
          />
          <p className="mt-1 text-xs text-gray-500">
            Số lượng tình nguyện viên tối đa cho sự kiện
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hình ảnh
        </label>
        <div 
          onClick={() => document.getElementById('image-input')?.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleImageUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="mt-1 cursor-pointer flex flex-col justify-center items-center px-6 pt-5 pb-6 
            border-2 border-gray-300 border-dashed rounded-lg
            hover:border-orange-500/50 transition-colors"
        >
          <input
            id="image-input"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
          <div className="space-y-2 text-center">
            <PhotographIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-orange-600">
                Click để tải ảnh lên
              </span>{' '}
              hoặc kéo và thả
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF (Tối đa 10MB)</p>
            <p className="text-xs text-orange-600">
              Bạn cũng có thể dán (Ctrl+V) ảnh trực tiếp
            </p>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt=""
                  className="h-24 w-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (eventType === 'online' && (!watch('onlinePlatform') || !watch('meetingLink'))) {
              toast.error('Vui lòng nhập đầy đủ thông tin cho sự kiện trực tuyến');
              return;
            }
            if ((eventType === 'offline' || eventType === 'hybrid') && !watch('physicalAddress')) {
              toast.error('Vui lòng nhập địa chỉ cho sự kiện trực tiếp');
              return;
            }
            goToNextStep();
          }}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-6">
      {/* Form Options */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
        <h3 className="font-medium text-gray-900">Tùy chọn form</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              {...register('needsRegistrationForm')}
              type="checkbox"
              className="text-orange-600 rounded border-gray-300 focus:ring-orange-500"
            />
            <span className="text-sm">Tạo form đăng ký tùy chỉnh</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              {...register('needsCollaboratorForm')}
              type="checkbox"
              className="text-orange-600 rounded border-gray-300 focus:ring-orange-500"
            />
            <span className="text-sm">Cần cộng tác viên hỗ trợ</span>
          </label>
        </div>
      </div>

      <div className="pt-6 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
        >
          Quay lại
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Đang cập nhật...' : 'Cập nhật sự kiện'}
        </button>
      </div>
    </div>
  );

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
            <Dialog.Panel 
              as={motion.div}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="w-full max-w-4xl transform rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Chỉnh sửa sự kiện
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 mt-1">
                    Bước {currentStep} / 3
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {currentStep === 1 && renderStepOne()}
                {currentStep === 2 && renderStepTwo()}
                {currentStep === 3 && renderStepThree()}
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditEventModal;
