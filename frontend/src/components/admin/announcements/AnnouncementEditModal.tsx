import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XIcon, PhotographIcon } from '@heroicons/react/outline';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  announcement: any;
  onSubmit: (data: FormData) => Promise<void>;
}

const AnnouncementEditModal = ({ isOpen, onClose, announcement, onSubmit }: Props) => {
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(announcement?.images || []);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: {
      title: announcement?.title,
      content: announcement?.content,
      category: announcement?.category,
      priority: announcement?.priority?.toString(),
      expiresAt: announcement?.expiresAt ? 
        format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm") : 
        undefined
    }
  });

  useEffect(() => {
    if (announcement && isOpen) {
      reset({
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        priority: announcement.priority?.toString(),
        expiresAt: announcement.expiresAt ? 
          format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm") : 
          undefined
      });
      setExistingImages(announcement.images || []);
    }
  }, [announcement, isOpen, reset]);

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      // Append basic fields
      Object.keys(data).forEach(key => {
        if (key !== 'images') {
          formData.append(key, data[key]);
        }
      });

      // Append new images
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      // Append existing images as JSON
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      await onSubmit(formData);
      onClose();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông báo');
    } finally {
      setLoading(false);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
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
            <Dialog.Panel className="w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-xl transition-all">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Chỉnh sửa thông báo
                </Dialog.Title>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tiêu đề
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Vui lòng nhập tiêu đề' })}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nội dung
                  </label>
                  <textarea
                    {...register('content', { required: 'Vui lòng nhập nội dung' })}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />                  {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content.message as string}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Danh mục
                    </label>
                    <select
                      {...register('category')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="academic">Học vụ</option>
                      <option value="general">Chung</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Thời gian hết hạn
                    </label>
                    <input
                      type="datetime-local"
                      {...register('expiresAt', { required: 'Vui lòng chọn thời gian hết hạn' })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hình ảnh đính kèm
                  </label>
                  <div 
                    onClick={() => document.getElementById('edit-image-input')?.click()}
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
                      id="edit-image-input"
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

                  {existingImages.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm text-gray-500 mb-2">Hình ảnh hiện tại:</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {existingImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image.url}
                              alt=""
                              className="h-24 w-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt=""
                            className="h-24 w-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
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

export default AnnouncementEditModal;
