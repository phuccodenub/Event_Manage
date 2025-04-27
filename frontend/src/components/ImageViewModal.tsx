import React, { useEffect, MouseEvent } from 'react';
import { IoClose } from 'react-icons/io5';
import { IoChevronBackOutline, IoChevronForwardOutline } from 'react-icons/io5';
import { IoLocationOutline, IoDesktopOutline } from 'react-icons/io5';
import { formatDistanceToNow } from 'date-fns';

interface Event {
  title: string;
  description: string;
  organizer: {
    fullName: string;
    email: string;
    avatar?: {
      public_id: string;
      url: string;
    };
  };
  createdAt: Date;
  eventType: 'offline' | 'online' | 'hybrid';
  location: {
    physical?: {
      address: string;
      room: string;
    };
    online?: {
      platform: string;
      meetingLink: string;
    };
  };
  participants: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

interface ImageViewModalProps {
  images: Array<{ url: string }>;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  event: Event;
}

const ImageViewModal: React.FC<ImageViewModalProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
  event
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center bg-black/90"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-white/80 p-2 hover:bg-white/10 hover:text-white rounded-full transition-all z-[60]"
      >
        <IoClose size={28} />
      </button>

      {/* Main Content Container */}
      <div className="flex w-full h-full">
        {/* Left side - Image */}
        <div className="flex-1 flex items-center justify-center relative h-screen" onClick={e => e.stopPropagation()}>
          {currentIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrevious(); }}
              className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <IoChevronBackOutline size={32} />
            </button>
          )}

          <img
            src={images[currentIndex].url}
            alt={event.title}
            className="max-h-screen max-w-[calc(100vw-400px)] object-contain"
          />

          {currentIndex < images.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <IoChevronForwardOutline size={32} />
            </button>
          )}
        </div>

        {/* Right side - Event Content */}
        <div className="w-[400px] bg-white h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex flex-col h-full">
            {/* Event Header */}
            <div className="p-4 border-b">
              <div className="flex items-center">
                <img
                  src={event.organizer?.avatar?.url || '/default-avatar.png'}
                  alt={event.organizer?.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-avatar.png';
                  }}
                />
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-[#000000]">
                    {event.organizer?.fullName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-3">
                      {(event.eventType === 'offline' || event.eventType === 'hybrid') && 
                        event.location?.physical?.address && (
                          <div className="flex items-center space-x-1">
                            <IoLocationOutline className="text-orange-500 w-3 h-3" />
                            <span className="text-xs text-gray-500 truncate max-w-[150px]">
                              {event.location.physical.room 
                                ? `${event.location.physical.address} - ${event.location.physical.room}`
                                : event.location.physical.address}
                            </span>
                          </div>
                      )}
                      {(event.eventType === 'online' || event.eventType === 'hybrid') && 
                        event.location?.online?.platform && (
                          <div className="flex items-center space-x-1">
                            <IoDesktopOutline className="text-orange-500 w-3 h-3" />
                            <span className="text-xs text-gray-500 truncate">
                              {event.location.online.platform} Meeting
                            </span>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Content */}
            <div className="p-4 flex-1">
              <h2 className="text-base font-semibold text-[#000000] mb-2">{event.title}</h2>
              <p className="text-sm text-[#666666]">{event.description}</p>
            </div>

            {/* Event Footer */}
            <div className="p-4 border-t mt-auto">
              <div className="flex justify-between items-center text-xs text-[#666666] mb-3">
                <span>{event.participants.length} attendees</span>
                <span>Status: {event.status}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewModal;
