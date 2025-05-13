import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface SenderAvatar {
  public_id?: string;
  url?: string;
}

interface Sender {
  _id?: string;
  fullName?: string;
  avatar?: SenderAvatar;
}

interface EventNotificationProps {
  title: string;
  message: string;
  time: Date;
  type: 'event' | 'warning';
  sender?: Sender;
}

// Helper function to get first letter of name
const getInitial = (name?: string): string => {
  return name ? name.charAt(0).toUpperCase() : '?';
};

// Format time in Vietnamese locale
const formatTime = (date: Date): string => {
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch {
    return 'vừa xong';
  }
};

const EventNotification: React.FC<EventNotificationProps> = ({
  title,
  message,
  time,
  type,
  sender
}) => {
  const notificationClass = type === 'event' ? 'notification-event' : 'notification-warning';
  
  return (
    <div className={`event-notification-container ${notificationClass}`}>
      <div className="event-notification-indicator"></div>
      
      <div className="event-notification-avatar">
        {sender?.avatar?.url ? (
          <div className="event-notification-avatar-img">
            <img 
              src={sender.avatar.url}
              alt={sender?.fullName || 'User'}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.textContent = getInitial(sender?.fullName);
              }}
            />
          </div>
        ) : (
          <div className="event-notification-avatar-img">
            {getInitial(sender?.fullName)}
          </div>
        )}
      </div>
      
      <div className="event-notification-content">
        <div className="event-notification-title">{title}</div>
        <div className="event-notification-message">{message}</div>
        <div className="event-notification-time">{formatTime(time)}</div>
      </div>
    </div>
  );
};

export default EventNotification; 