import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XIcon, PhotographIcon } from '@heroicons/react/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import departmentService from '@/services/departmentService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
}

interface Department {
  _id: string;
  name: string;
}

const AnnouncementAddModal = ({ isOpen, onClose, onSubmit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append form fields
      Object.keys(data).forEach(key => {
        if (key !== 'images') {
          formData.append(key, data[key]);
        }
      });
      
      // Append selected images
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      await onSubmit(formData);
      reset();
      setSelectedImages([]);
      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
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
      }
    };
    fetchDepartments();
  }, []);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Overlay */}
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
            <Dialog.Panel className="w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Tạo thông báo mới
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                {/* Tiêu đề */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tiêu đề <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-500">{errors.title.message as string}</p>
                  )}
                </div>

                {/* Nội dung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nội dung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('content', { required: 'Vui lòng nhập nội dung' })}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  {errors.content && (
                    <p className="mt-1 text-sm text-red-500">{errors.content.message as string}</p>
                  )}
                </div>

                {/* Category, Priority & Department */}
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
                      <option value="academic">Học vụ</option>
                      <option value="general">Thông tin chung</option>
                      <option value="event">Sự kiện</option>
                      <option value="news">Tin tức</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Độ ưu tiên
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    >
                      <option value="0">Bình thường</option>
                      <option value="1">Cao</option>
                      <option value="2">Rất cao</option>
                    </select>
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
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.department.message as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* Thời gian hết hạn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thời gian hết hạn <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('expiresAt', { required: 'Vui lòng chọn thời gian hết hạn' })}
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh đính kèm
                  </label>
                  <div 
                    onClick={() => document.getElementById('image-input')?.click()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const files = Array.from(e.dataTransfer.files).filter(
                        file => file.type.startsWith('image/')
                      );
                      setSelectedImages(prev => [...prev, ...files]);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    className="mt-1 cursor-pointer flex flex-col justify-center items-center px-6 pt-5 pb-6 
                      border-2 border-gray-300 border-dashed rounded-lg
                      hover:border-orange-500/50 transition-colors
                      focus-visible:outline-none focus-visible:ring-2 
                      focus-visible:ring-orange-500"
                  >
                    <input
                      id="image-input"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <div className="space-y-2 text-center">
                      <PhotographIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-orange-600">
                          Click để tải ảnh lên
                        </span>{' '}
                        hoặc kéo và thả
                      </div>
                      <p className="text-xs text-gray-500">
                        Hỗ trợ PNG, JPG, GIF (Tối đa 10MB)
                      </p>
                      <p className="text-xs text-orange-600">
                        Bạn cũng có thể dán (Ctrl+V) ảnh trực tiếp
                      </p>
                    </div>
                  </div>
                  {selectedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      {Array.from(selectedImages).map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt=""
                            className="h-24 w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-6 border-t flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    {loading ? 'Đang tạo...' : 'Tạo thông báo'}
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

export default AnnouncementAddModal;
