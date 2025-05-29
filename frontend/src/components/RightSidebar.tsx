import React, { useEffect } from 'react';
import { CalendarIcon, LocationMarkerIcon } from '@heroicons/react/outline';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import eventService from '../services/eventService';
import Footer from './Footer';
import JoinEventButton from './JoinEventButton';
import CollaborateEventButton from './CollaborateEventButton';
import { Event } from '../types';
import { getEventStartDate, getEventEndDate, formatEventTimeDisplay } from '../utils/dateUtils';

// Define cache keys for RightSidebar
const RIGHT_SIDEBAR_CACHE = {
  EVENTS: 'right_sidebar_events_cache',
  LAST_FETCH: 'right_sidebar_last_fetch_time'
};

// Cache expiry time (5 minutes in milliseconds)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

const RightSidebar: React.FC = () => {
  const { events, updateEventParticipants, setEvents } = useEvents();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Check if page was manually refreshed
  const isManualRefresh = () => {
    const now = Date.now();
    const lastRefresh = parseInt(localStorage.getItem('page_load_timestamp') || '0', 10);
    
    // Set the current timestamp
    localStorage.setItem('page_load_timestamp', now.toString());
    
    // If this is the first load or the time difference is small (e.g., within 1 second), 
    // it's likely a manual refresh or initial page load
    return lastRefresh === 0 || (now - lastRefresh) < 1000;
  };

  // Function to check if cache is still valid
  const isCacheValid = (): boolean => {
    // Skip cache if this is a manual refresh
    if (isManualRefresh()) {
      return false;
    }
    
    const lastFetchTime = localStorage.getItem(RIGHT_SIDEBAR_CACHE.LAST_FETCH);
    
    if (!lastFetchTime) {
      return false;
    }

    const lastFetch = parseInt(lastFetchTime, 10);
    const now = Date.now();
    
    // Cache is valid if less than CACHE_EXPIRY_TIME has passed
    return now - lastFetch < CACHE_EXPIRY_TIME;
  };

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      // Update the last access time
      localStorage.setItem(RIGHT_SIDEBAR_CACHE.LAST_FETCH, Date.now().toString());
      
      // Check for manual refresh
      const shouldSkipCache = isManualRefresh();
      
      // Try to use cached data if appropriate and not a manual refresh
      if (!shouldSkipCache && isCacheValid()) {
        try {
          const cachedEvents = localStorage.getItem(RIGHT_SIDEBAR_CACHE.EVENTS);
          
          if (cachedEvents) {
            const parsedEvents = JSON.parse(cachedEvents);
            setEvents(parsedEvents);
            return;
          }
        } catch (error) {
          console.error('Error loading from cache:', error);
          // If there's an error with the cache, proceed to fetch from API
        }
      }

      // If cache is not valid, skipped due to manual refresh, or doesn't exist, fetch from API
      try {
        const allEvents = await eventService.getAllEvents();
        setEvents(allEvents); // Store in global state
        
        // Save to cache
        try {
          localStorage.setItem(RIGHT_SIDEBAR_CACHE.EVENTS, JSON.stringify(allEvents));
        } catch (cacheError) {
          console.error('Error saving to cache:', cacheError);
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      }
    };

    fetchUpcomingEvents();
  }, [setEvents]);

  const upcomingEvents = events
    .filter(event => {
      // Check if event has eventDays structure
      if (event.eventDays && event.eventDays.length > 0) {
        const startDate = getEventStartDate(event.eventDays);
        return startDate && startDate > new Date();
      }
      // Fallback to old structure
      if (event.startDate) {
        return new Date(event.startDate) > new Date();
      }
      return false;
    })
    .slice(0, 2)
    .map(event => {
      let dateDisplay = 'Chưa xác định';
      
      if (event.eventDays && event.eventDays.length > 0) {
        dateDisplay = formatEventTimeDisplay(event.eventDays);
      } else if (event.startDate && event.endDate) {
        dateDisplay = `${new Date(event.startDate).toLocaleString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} - ${new Date(event.endDate).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`;
      }
      
      return {
        ...event,
        date: dateDisplay,
      };
    });

  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <aside className="hidden md:block col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">🎉 Sự kiện sắp diễn ra</h2>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: Event & { date: string }) => (
              <div
                key={event._id}
                className="mb-6 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => setLocation(`/events/${event._id}`)}
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{event.title}</h3>
                  {/* {event.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                      {event.description}
                    </p>
                  )} */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <LocationMarkerIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {event.location?.physical?.address 
                        ? `${event.location.physical.address}${event.location.physical.room ? ` - ${event.location.physical.room}` : ''}`
                        : 'Địa điểm không xác định'}
                    </span>
                  </div>
                </div>
                <div 
                  className="mt-4 right-0 flex flex-col sm:flex-row sm:justify-end gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <JoinEventButton 
                    eventId={event._id}
                    participants={event.participants || []}                    startDate={event.eventDays ? getEventStartDate(event.eventDays) || undefined : event.startDate ? new Date(event.startDate) : undefined}
                    endDate={event.eventDays ? getEventEndDate(event.eventDays) || undefined : event.endDate ? new Date(event.endDate) : undefined}
                    status={event.status}
                    isCompact={true}
                    creatorId={event.creator?._id}
                    organizerId={event.organizer?._id}
                  />
                  
                  {user && user._id && event.status !== 'cancelled' && event.status !== 'completed' && (
                    <CollaborateEventButton 
                      eventId={event._id}
                      status={event.status}
                      isCompact={true}
                      organizerId={event.organizer?._id}
                      creatorId={event.creator?._id}
                      setupTime={event.setupTime}
                    />
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center">Không có sự kiện nào sắp diễn ra.</p>
          )}
        </div>
      </aside>

      <Footer />
    </div>
  );
};

export default RightSidebar;
