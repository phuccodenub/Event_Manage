import React from 'react';
import { IoLocationOutline, IoDesktopOutline } from 'react-icons/io5';

interface LocationProps {
  eventType: 'offline' | 'online' | 'hybrid';
  location?: {
    physical?: {
      address?: string;
      room?: string;
    };
    online?: {
      platform?: string;
      meetingLink?: string;
    };
  };
}

const EventLocation: React.FC<LocationProps> = ({ eventType, location }) => {
  if (!location) return null;

  return (
    <div className="space-y-2">
      {(eventType === 'offline' || eventType === 'hybrid') && location.physical?.address && (
        <div className="flex items-center space-x-2">
          <IoLocationOutline className="text-orange-500 w-4 h-4 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">
            {location.physical.room 
              ? `${location.physical.address} - ${location.physical.room}` 
              : location.physical.address}
          </span>
        </div>
      )}
      
      {(eventType === 'online' || eventType === 'hybrid') && location.online?.platform && (
        <div className="flex items-center space-x-2">
          <IoDesktopOutline className="text-orange-500 w-4 h-4 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">
            {location.online.platform} Meeting
          </span>
        </div>
      )}
    </div>
  );
};

export default EventLocation;
