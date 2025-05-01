import React, { useState, useCallback } from 'react';
import { IoCloudUploadOutline, IoClose } from 'react-icons/io5';
import { useDropzone } from 'react-dropzone';

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
}

const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  isLoading
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File size too large. Maximum size is 5MB');
        return;
      }
      setPreview(URL.createObjectURL(file));
      // Don't upload immediately, wait for user confirmation
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  });

  const handleSubmit = async () => {
    if (!preview) return;
    setError(null);
    
    try {
      const response = await fetch(preview);
      const blob = await response.blob();
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      await onUpload(file);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cập nhật ảnh đại diện</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <IoClose className="text-gray-500 text-xl" />
          </button>
        </div>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-500'}
          `}
        >
          <input {...getInputProps()} />
          
          {preview ? (
            <div className="space-y-4">
              <img 
                src={preview} 
                alt="Avatar preview" 
                className="w-32 h-32 rounded-full mx-auto object-cover"
              />
              <p className="text-sm text-gray-500">Click hoặc kéo thả để chọn ảnh khác</p>
            </div>
          ) : (
            <div className="space-y-2">
              <IoCloudUploadOutline className="mx-auto text-4xl text-gray-400" />
              <p className="text-gray-600">Click hoặc kéo thả ảnh vào đây</p>
              <p className="text-sm text-gray-500">PNG, JPG or GIF (max. 5MB)</p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!preview || isLoading}
            className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg
              ${!preview || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'}
            `}
          >
            {isLoading ? 'Đang tải lên...' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarUploadModal;
