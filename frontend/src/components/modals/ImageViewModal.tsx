import React from 'react';
import { IoClose, IoChevronBack, IoChevronForward } from 'react-icons/io5';

interface ImageViewModalProps {
  images: Array<{ url: string }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  event?: {
    title: string;
    description: string;
    organizer: {
      fullName: string;
      avatar?: string | { url: string };
    };
    createdAt: Date;
  };
}

const ImageViewModal: React.FC<ImageViewModalProps> = ({
  images = [], // Provide default empty array
  currentIndex = 0,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  event
}) => {
  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-3">
          {event && (
            <>
              <img
                src={typeof event.organizer.avatar === 'string' 
                  ? event.organizer.avatar 
                  : event.organizer.avatar?.url || '/default-avatar.png'}
                alt={event.organizer.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{event.title}</h3>
                <p className="text-sm opacity-80">{event.organizer.fullName}</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <IoClose size={24} />
        </button>
      </div>

      {/* Main Image View */}
      <div className="flex-1 flex items-center justify-center relative">
        <img
          src={images[currentIndex].url}
          alt={`Image ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-[90vw] object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className={`absolute left-4 p-2 rounded-full 
                ${currentIndex === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-white hover:bg-white/10'
                } transition-colors`}
            >
              <IoChevronBack size={24} />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className={`absolute right-4 p-2 rounded-full 
                ${currentIndex === images.length - 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-white hover:bg-white/10'
                } transition-colors`}
            >
              <IoChevronForward size={24} />
            </button>
          </>
        )}
      </div>

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="text-center text-white py-4">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default ImageViewModal;
