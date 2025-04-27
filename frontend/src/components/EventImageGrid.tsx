import React, { useState } from 'react';
import ImageViewModal from './ImageViewModal';

interface EventImageGridProps {
  images: Array<{ url: string }>;
  title: string;
  event: {
    title: string;
    description: string;
    organizer: {
      fullName: string;
      avatar?: string;
    };
    createdAt: Date;
  };
}

const EventImageGrid: React.FC<EventImageGridProps> = ({ images, title, event }) => {
  const [showAllImages, setShowAllImages] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  if (images.length === 1) {
    return (
      <>
        <div
          className="mt-3 relative aspect-[16/9] rounded-lg overflow-hidden cursor-pointer"
          onClick={() => handleImageClick(0)}
        >
          <img
            src={images[0].url}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <ImageViewModal
          images={images}
          currentIndex={selectedImageIndex || 0}
          isOpen={selectedImageIndex !== null}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
          event={event}
        />
      </>
    );
  }

  if (images.length === 2) {
    return (
      <>
        <div className="mt-3 relative aspect-[16/9] grid grid-cols-2 gap-1">
          {images.map((image, i) => (
            <div
              key={i}
              className="relative cursor-pointer"
              onClick={() => handleImageClick(i)}
            >
              <img
                src={image.url}
                alt={`${title} - ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover ${
                  i === 0 ? 'rounded-l-lg' : 'rounded-r-lg'
                }`}
              />
            </div>
          ))}
        </div>
        <ImageViewModal
          images={images}
          currentIndex={selectedImageIndex || 0}
          isOpen={selectedImageIndex !== null}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
          event={event}
        />
      </>
    );
  }

  if (images.length === 3) {
    return (
      <>
        <div className="mt-3 relative aspect-[16/9] grid grid-cols-2 gap-1">
          <div
            className="relative cursor-pointer"
            onClick={() => handleImageClick(0)}
          >
            <img
              src={images[0].url}
              alt={`${title} - 1`}
              className="absolute inset-0 w-full h-full object-cover rounded-l-lg"
            />
          </div>
          <div className="grid grid-rows-2 gap-1">
            {images.slice(1, 3).map((image, i) => (
              <div
                key={i}
                className="relative cursor-pointer"
                onClick={() => handleImageClick(i + 1)}
              >
                <img
                  src={image.url}
                  alt={`${title} - ${i + 2}`}
                  className={`absolute inset-0 w-full h-full object-cover ${
                    i === 0 ? 'rounded-tr-lg' : 'rounded-br-lg'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
        <ImageViewModal
          images={images}
          currentIndex={selectedImageIndex || 0}
          isOpen={selectedImageIndex !== null}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrevious={handlePreviousImage}
          event={event}
        />
      </>
    );
  }

  // For 4 or more images
  return (
    <>
      <div className="mt-3 relative aspect-[16/9] grid grid-cols-2 gap-1">
        <div className="grid grid-rows-2 gap-1">
          {images.slice(0, 2).map((image, i) => (
            <div
              key={i}
              className="relative cursor-pointer"
              onClick={() => handleImageClick(i)}
            >
              <img
                src={image.url}
                alt={`${title} - ${i + 1}`}
                className={`absolute inset-0 w-full h-full object-cover ${
                  i === 0 ? 'rounded-tl-lg' : 'rounded-bl-lg'
                }`}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-rows-2 gap-1">
          {images.slice(2, 4).map((image, i) => (
            <div
              key={i}
              className="relative cursor-pointer"
              onClick={() => handleImageClick(i + 2)}
            >
              <img
                src={image.url}
                alt={`${title} - ${i + 3}`}
                className={`absolute inset-0 w-full h-full object-cover ${
                  i === 0 ? 'rounded-tr-lg' : 'rounded-br-lg'
                }`}
              />
              {!showAllImages && i === 1 && images.length > 4 && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors rounded-br-lg"
                >
                  <span className="text-white text-xl font-semibold">
                    +{images.length - 4}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <ImageViewModal
        images={images}
        currentIndex={selectedImageIndex || 0}
        isOpen={selectedImageIndex !== null}
        onClose={handleCloseModal}
        onNext={handleNextImage}
        onPrevious={handlePreviousImage}
        event={event}
      />
    </>
  );
};

export default EventImageGrid;
