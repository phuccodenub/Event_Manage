import React from 'react';
import { useLocation } from 'wouter';
import { 
  IoCalendarOutline,
  IoAddOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoPeopleOutline
} from 'react-icons/io5';
import { Event } from '../../types';
import { getEventStartDate, getEventEndDate, formatEventTimeDisplay } from '../../utils/dateUtils';
import LoadingSpinner from '../LoadingSpinner';
import JoinEventButton from '../JoinEventButton';
import CollaborateEventButton from '../CollaborateEventButton';
import { useAuth } from '../../context/AuthContext';

interface CommunityEventsProps {
  events: Event[];
  loading: boolean;
  canManage: boolean;
  onCreateEvent: () => void;
}

const CommunityEvents: React.FC<CommunityEventsProps> = ({
  events,
  loading,
  canManage,
  onCreateEvent
}) => {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Function to get event image with proper fallback
  const getEventImageUrl = (event: Event): string => {
    // Try to get image from event.images array
    if (event.images && event.images.length > 0 && event.images[0].url) {
      return event.images[0].url;
    }
    
    // Try to get from coverImage field (if exists)
    if ((event as any).coverImage?.url) {
      return (event as any).coverImage.url;
    }
    
    // Create placeholder with event title
    const eventTitle = event.title || 'Event';
    return `https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80&overlay-text=${encodeURIComponent(eventTitle)}`;
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <IoCalendarOutline className="mr-2 text-orange-500" />
          Sự kiện ({events.length})
        </h2>
        {canManage && (
          <button
            onClick={onCreateEvent}
            className="flex items-center px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <IoAddOutline className="mr-1" />
            Tạo sự kiện
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-6">
          {events.map(event => {
            const eventStartDate = event.eventDays ? getEventStartDate(event.eventDays) : (event.startDate ? new Date(event.startDate) : null);
            const eventEndDate = event.eventDays ? getEventEndDate(event.eventDays) : (event.endDate ? new Date(event.endDate) : null);
            const timeDisplay = event.eventDays ? formatEventTimeDisplay(event.eventDays) : 
              (eventStartDate ? eventStartDate.toLocaleDateString('vi-VN') : 'Chưa xác định');

            return (
              <div key={event._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row">
                  {/* Event Image */}
                  <div className="lg:w-1/3 h-48 lg:h-auto">
                    <img
                      src={getEventImageUrl(event)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Secondary fallback - use a colored placeholder
                        target.src = `https://placehold.co/400x300/f97316/white?text=${encodeURIComponent(event.title || 'Event')}`;
                      }}
                    />
                  </div>
                  
                  {/* Event Content */}
                  <div className="p-4 lg:p-6 flex-1 flex flex-col">
                    {/* Event Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs text-orange-600 font-bold">
                        {event.organizer?.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span className="text-sm text-gray-600">
                        {event.organizer?.fullName || 'Unknown'} 
                        {event.department?.name && ` • ${event.department.name}`}
                        {/* Show visibility badge for private events */}
                        {event.visibility === 'private' && (
                          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Riêng tư
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h3 
                      className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-orange-600 transition-colors"
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      {event.title}
                    </h3>
                    
                    {/* Event Description */}
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                    
                    {/* Event Details */}
                    <div className="flex flex-wrap gap-3 mb-4">
                      <div className="flex items-center text-gray-500">
                        <IoTimeOutline className="mr-1" />
                        <span className="text-sm">{timeDisplay}</span>
                      </div>
                      {event.location?.physical?.address && (
                        <div className="flex items-center text-gray-500">
                          <IoLocationOutline className="mr-1" />
                          <span className="text-sm">
                            {event.location.physical.room 
                              ? `${event.location.physical.address} - ${event.location.physical.room}`
                              : event.location.physical.address}
                          </span>
                        </div>
                      )}
                      {event.capacity && (
                        <div className="flex items-center text-gray-500">
                          <IoPeopleOutline className="mr-1" />
                          <span className="text-sm">{event.participants?.length || 0}/{event.capacity} người</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                      <button 
                        onClick={() => navigate(`/events/${event._id}`)}
                        className="px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors text-sm"
                      >
                        Xem chi tiết
                      </button>
                      
                      {user && (
                        <>
                          <JoinEventButton 
                            eventId={event._id}
                            participants={event.participants || []}
                            startDate={eventStartDate || undefined}
                            endDate={eventEndDate || undefined}
                            status={event.status}
                            isCompact={true}
                            creatorId={event.creator?._id}
                            organizerId={event.organizer?._id}
                          />
                          
                          {event.needsCollaboratorForm && event.status !== 'cancelled' && event.status !== 'completed' && (
                            <CollaborateEventButton 
                              eventId={event._id}
                              status={event.status}
                              isCompact={true}
                              organizerId={event.organizer?._id}
                              creatorId={event.creator?._id}
                              eventExists={true}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <div className="inline-block p-3 bg-gray-100 rounded-full mb-4">
            <IoCalendarOutline className="text-3xl text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Chưa có sự kiện nào</h3>
          <p className="text-gray-500 mt-1">Hiện tại chưa có sự kiện nào được tạo trong cộng đồng này</p>
          {canManage && (
            <button
              onClick={onCreateEvent}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Tạo sự kiện đầu tiên
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityEvents; 