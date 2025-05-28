import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XIcon, PhotographIcon } from '@heroicons/react/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import departmentService from '@/services/departmentService';
import uploadService from '@/services/uploadService';
import { motion } from 'framer-motion';
import type { Event, Department } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, eventData: any) => Promise<void>;
  event: Event | null;
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

// Thêm helper function để format thời gian
const formatDateTimeForInput = (dateValue: string | Date) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  // Giữ nguyên múi giờ khi format
  return date.toISOString().slice(0, 16);
};

const formatDateTimeForSubmit = (dateString: string) => {
  const date = new Date(dateString);
  return date.toISOString(); // Format: "2025-04-24T06:00:00.000Z"
};

const EditEventModal = ({ isOpen, onClose, onSubmit, event }: Props) => {
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm();
  const eventType = watch('eventType', event?.eventType || 'offline');

  useEffect(() => {
    if (event) {
      // Basic information
      setValue('title', event.title);
      setValue('description', event.description);      setValue('category', event.category || '');
      setValue('department', event.department?._id);
      setValue('eventType', event.eventType);
      setValue('capacity', event.capacity);
      setValue('visibility', event.visibility);
      setValue('status', event.status);

      // Format thời gian đúng chuẩn khi load form
      setValue('startDate', event.startDate ? formatDateTimeForInput(event.startDate) : '');
      setValue('endDate', event.endDate ? formatDateTimeForInput(event.endDate) : '');

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

  // Add paste handler
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

  // Add useEffect for paste event listener
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

      // Format location data properly
      const location = {
        ...(data.eventType === 'offline' || data.eventType === 'hybrid' ? {
          physical: {
            address: data.physicalAddress?.trim(),
            room: data.physicalRoom?.trim() || ''
          }
        } : {}),
        ...(data.eventType === 'online' || data.eventType === 'hybrid' ? {
          online: {
            platform: data.onlinePlatform,
            meetingLink: data.meetingLink?.trim()
          }
        } : {})
      };

      const eventData = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        department: data.department,
        eventType: data.eventType,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        visibility: 'public',
        status: event.status,
        location: JSON.stringify(location),
        capacity: data.capacity ? parseInt(data.capacity) : undefined,
        // Keep original arrays
        organizer: event.organizer._id,
        creator: event.creator,        participants: event.participants || [],
        collaborators: event.collaborators || [],
        speakers: event.speakers || [],
        tags: event.tags || [],
        likes: event.likes || [],
        comments: event.comments || [],
        shares: event.shares || []
      };

      // Handle images first
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

      const formDataToSubmit = new FormData();
      
      // Add each field to FormData
      Object.entries(eventData).forEach(([key, value]) => {
        // Only append arrays if they exist and have elements
        if (Array.isArray(value)) {
          if (value.length > 0) {
            formDataToSubmit.append(key, JSON.stringify(value));
          }
        } else {
          formDataToSubmit.append(key, value?.toString() || '');
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
      // toast.success('Cập nhật sự kiện thành công');
      onClose();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sự kiện');
    } finally {
      setLoading(false);
    }
  };

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
              as={motion.div}              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="w-full max-w-7xl transform rounded-xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Chỉnh sửa sự kiện
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Main content in 2 columns */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Left column - Basic info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên sự kiện <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register('title', { required: 'Vui lòng nhập tên sự kiện' })}
                        type="text"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...register('description', { required: 'Vui lòng nhập mô tả' })}
                        rows={5}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Khoa <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register('department', { required: 'Vui lòng chọn khoa' })}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          <option value="">Chọn khoa</option>
                          {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                        {errors.department && (
                          <p className="mt-1 text-sm text-red-500">{errors.department.message as string}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian bắt đầu
                        </label>
                        <input
                          {...register('startDate')}
                          type="datetime-local"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Thời gian kết thúc
                        </label>
                        <input
                          {...register('endDate')}
                          type="datetime-local"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right column - Additional info */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Danh mục
                        </label>
                        <select
                          {...register('category')}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          {Object.entries(EVENT_CATEGORIES).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hình thức
                        </label>
                        <select
                          {...register('eventType')}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        >
                          {Object.entries(EVENT_TYPES).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(eventType === 'offline' || eventType === 'hybrid') && (
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Địa điểm</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            {...register('physicalAddress')}
                            placeholder="Địa chỉ"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                          <input
                            {...register('physicalRoom')}
                            placeholder="Phòng"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                        </div>
                      </div>
                    )}

                    {(eventType === 'online' || eventType === 'hybrid') && (
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Thông tin trực tuyến</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <select
                            {...register('onlinePlatform')}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          >
                            <option value="Zoom">Zoom</option>
                            <option value="Google Meet">Google Meet</option>
                            <option value="Microsoft Teams">Microsoft Teams</option>
                            <option value="Other">Khác</option>
                          </select>
                          <input
                            {...register('meetingLink')}
                            placeholder="Link meeting"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hình ảnh
                      </label>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        {/* Existing images preview */}
                        {previews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt=""
                              className="h-48 w-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Upload button with paste hint */}
                        <div
                          onClick={() => document.getElementById('image-input')?.click()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleImageUpload(e.dataTransfer.files);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 space-y-1"
                        >
                          <PhotographIcon className="h-8 w-8 text-gray-400" />
                          <p className="text-xs text-orange-600">
                            Click hoặc paste ảnh (Ctrl+V)
                          </p>
                        </div>
                        <input
                          id="image-input"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e.target.files)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
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
