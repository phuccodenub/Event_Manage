import { useState } from 'react';
import { XIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';

interface ImageGalleryProps {
  images: Array<{ url: string }>;
  onClose?: () => void;
}

const ImageGallery = ({ images, onClose }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length) return null;

  return (
    <div className="relative w-full h-full">
      {/* Main Image */}
      <div 
        className="relative aspect-square bg-gray-100 cursor-zoom-in"
        onClick={() => setShowFullscreen(true)}
      >
        <img
          src={images[selectedIndex].url}
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Thumbnails */}
      <div className="mt-2 grid grid-cols-5 gap-2">
        {images.map((image, idx) => (
          <button
            key={idx}
            className={`relative aspect-square border-2 rounded-md overflow-hidden 
              ${idx === selectedIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
            onClick={() => setSelectedIndex(idx)}
          >
            <img
              src={image.url}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Fullscreen View */}
      {showFullscreen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <XIcon className="w-6 h-6" />
          </button>

          <button
            onClick={handlePrevious}
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronLeftIcon className="w-8 h-8" />
          </button>

          <div className="w-full max-w-6xl max-h-[90vh] px-16">
            <img
              src={images[selectedIndex].url}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          <button
            onClick={handleNext}
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronRightIcon className="w-8 h-8" />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
