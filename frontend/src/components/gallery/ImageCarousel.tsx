import { useState, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';

interface ImageCarouselProps {
  images: Array<{ url: string }>;
  onImageClick?: (index: number) => void;
}

const ImageCarousel = ({ images, onImageClick }: ImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 100; // Width of each thumbnail + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative">
      {/* Main Image */}
      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
        <img
          src={images[activeIndex].url}
          alt=""
          className="w-full h-full object-contain"
          onClick={() => onImageClick?.(activeIndex)}
        />
      </div>

      {/* Thumbnails */}
      <div className="relative mt-4">
        {images.length > 5 && (
          <>
            <button 
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md z-10 hover:bg-gray-100"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md z-10 hover:bg-gray-100"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </>
        )}
        
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar"
          style={{ scrollBehavior: 'smooth' }}
        >
          {images.map((image, idx) => (
            <button
              key={idx}
              className={`flex-shrink-0 w-[100px] aspect-[4/3] rounded-md overflow-hidden border-2 transition-colors
                ${idx === activeIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
              onClick={() => setActiveIndex(idx)}
            >
              <img
                src={image.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageCarousel;
