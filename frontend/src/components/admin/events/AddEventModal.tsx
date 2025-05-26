import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XIcon, PhotographIcon, LocationMarkerIcon, ClockIcon } from '@heroicons/react/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import departmentService from '@/services/departmentService';
import uploadService from '@/services/uploadService';
import eventService from '@/services/eventService';
import notificationService from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import { useEvents } from '@/context/EventContext';
import { motion } from 'framer-motion';
import type { FormField } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Department {
  _id: string;
  name: string;
  code: string;
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

const FIELD_TYPES = {
  text: 'Văn bản ngắn',
  textarea: 'Văn bản dài',
  number: 'Số',
  email: 'Email',
  radio: 'Radio buttons',
  checkbox: 'Checkbox',
  date: 'Ngày'
};

const AddEventModal = ({ isOpen, onClose }: Props) => {
  const { user } = useAuth();
  const { addEvent, fetchEvents } = useEvents();
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const eventType = watch('eventType', 'offline');

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

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    document.addEventListener('paste', handleImagePaste);
    return () => {
      document.removeEventListener('paste', handleImagePaste);
    };
  }, []);

  const handleAddField = (type: string) => {
    const newField: FormField = {
      fieldId: `field_${Date.now()}`,
      label: 'Câu hỏi mới',
      type,
      required: false
    };

    if (['select', 'radio', 'checkbox'].includes(type)) {
      newField.options = [{ label: 'Tùy chọn 1', value: '1' }];
    }

    setCustomFields([...customFields, newField]);
  };

  const handleUpdateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...customFields];
    newFields[index] = { ...newFields[index], ...updates };
    setCustomFields(newFields);
  };

  const handleDeleteField = (index: number) => {
    setCustomFields(fields => fields.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      // Validate dates
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (endDate <= startDate) {
        toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }

      const formDataToSubmit = new FormData();

      // Basic event information
      formDataToSubmit.append('title', data.title.trim());
      formDataToSubmit.append('description', data.description.trim());
      formDataToSubmit.append('category', data.category);
      formDataToSubmit.append('department', data.department);
      formDataToSubmit.append('eventType', data.eventType);
      formDataToSubmit.append('organizer', user?._id || '');
      
      // Format dates to ISO string
      formDataToSubmit.append('startDate', startDate.toISOString());
      formDataToSubmit.append('endDate', endDate.toISOString());

      // Add setupTime (required by the model)
      const setupStartTime = new Date(startDate);
      setupStartTime.setHours(setupStartTime.getHours() - 1); // Mặc định setup bắt đầu 1 giờ trước sự kiện
      formDataToSubmit.append('setupTime[start]', setupStartTime.toISOString());
      formDataToSubmit.append('setupTime[end]', startDate.toISOString());

      // Handle capacity
      if (data.capacity && parseInt(data.capacity) > 0) {
        formDataToSubmit.append('capacity', data.capacity.toString());
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
      if (selectedImages.length > 0) {
        try {
          const uploadedFiles = await uploadService.uploadEventImages(selectedImages);
          uploadedFiles.forEach((image, index) => {
            formDataToSubmit.append(`images[${index}][public_id]`, image.public_id);
            formDataToSubmit.append(`images[${index}][url]`, image.url);
          });
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          toast.error('Có lỗi khi tải ảnh lên');
          return;
        }
      }

      // Add registration form data
      formDataToSubmit.append('needsRegistrationForm', 'true');
      formDataToSubmit.append('formFields', JSON.stringify(customFields));

      // Create event
      const newEvent = await eventService.createEvent(formDataToSubmit);
      
      // Add to context instead of refreshing entire list
      addEvent(newEvent);

      // Create notification
      await notificationService.createMassNotification({
        recipients: ['all'],
        type: 'new_event',
        title: 'Sự kiện mới',
        message: `Một sự kiện mới "${data.title}" đã được tạo`,
        relatedModel: 'Event',
        relatedId: newEvent._id,
        link: `/events/${newEvent._id}`
      });

      // Reset form with animation
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for animation
      reset();
      setSelectedImages([]);
      setPreviews([]);
      onClose();
      toast.success('Tạo sự kiện thành công');
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo sự kiện');
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!watch('title') || !watch('description') || !watch('category') || !watch('department') || 
          !watch('startDate') || !watch('endDate')) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời gian bắt đầu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <ClockIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/4" />
            <input
              {...register('startDate', { required: 'Vui lòng chọn thời gian bắt đầu' })}
              type="datetime-local"
              className="w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-500">{errors.startDate.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời gian kết thúc <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <ClockIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/4" />
            <input
              {...register('endDate', { required: 'Vui lòng chọn thời gian kết thúc' })}
              type="datetime-local"
              className="w-full pl-10 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          {errors.endDate && (
            <p className="mt-1 text-sm text-red-500">{errors.endDate.message as string}</p>
          )}
        </div>
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
      <div className="flex gap-2 mb-4">
        {Object.entries(FIELD_TYPES).map(([type, label]) => (
          <button
            key={type}
            type="button" // Thêm type="button" để ngăn submit
            onClick={(e) => {
              e.preventDefault(); // Thêm để đảm bảo không submit
              handleAddField(type);
            }}
            className="px-3 py-1 text-sm bg-orange-100 hover:bg-orange-200 
                     text-orange-700 rounded-full transition-colors"
          >
            + {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {customFields.map((field, index) => (
          <div
            key={field.fieldId}
            className="p-4 bg-white rounded-lg shadow-sm border 
                     border-gray-200 hover:border-orange-300 
                     transition-colors"
          >
            <div className="grid gap-4">
              <div className="flex justify-between">
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                  className="text-lg font-medium bg-transparent border-none 
                           focus:outline-none focus:ring-2 focus:ring-orange-500/20 
                           rounded px-2 py-1 w-full"
                  placeholder="Nhập câu hỏi..."
                />
                <button
                  onClick={() => handleDeleteField(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              {['radio', 'checkbox'].includes(field.type) && (
                <div className="space-y-2">
                  {field.options?.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          e.preventDefault(); // Thêm để ngăn submit
                          const newOptions = [...(field.options || [])];
                          newOptions[optionIndex] = {
                            ...newOptions[optionIndex],
                            label: e.target.value,
                            value: e.target.value
                          };
                          handleUpdateField(index, { options: newOptions });
                        }}
                        className="border-gray-300 rounded-md focus:border-orange-500 
                                 focus:ring-orange-500/20"
                        placeholder={`Tùy chọn ${optionIndex + 1}`}
                      />
                      <button
                        type="button" // Thêm type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const newOptions = field.options?.filter((_, i) => i !== optionIndex);
                          handleUpdateField(index, { options: newOptions });
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button" // Thêm type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const newOptions = [...(field.options || [])];
                      newOptions.push({ label: '', value: '' });
                      handleUpdateField(index, { options: newOptions });
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    + Thêm tùy chọn
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                    className="text-orange-600 rounded border-gray-300 
                             focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">Bắt buộc</span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg"
        >
          Quay lại
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Đang tạo...' : 'Tạo sự kiện'}
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
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-4xl transform rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Dialog.Title className="text-xl font-semibold text-gray-900">
                    Tạo sự kiện mới
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

export default AddEventModal;
