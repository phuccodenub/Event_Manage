import React, { useEffect } from 'react';
import { CalendarIcon, LocationMarkerIcon } from '@heroicons/react/outline';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import eventService from '../services/eventService';
import Footer from './Footer';
import JoinEventButton from './JoinEventButton';

const RightSidebar: React.FC = () => {
  const { events, updateEventParticipants, setEvents } = useEvents();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      const allEvents = await eventService.getAllEvents();
      setEvents(allEvents); // Lưu vào global state
    };

    fetchUpcomingEvents();
  }, []);

  const upcomingEvents = events
    .filter(event => new Date(event.startDate) > new Date())
    .slice(0, 2)
    .map(event => ({
      ...event,
      date: `${new Date(event.startDate).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })} - ${new Date(event.endDate).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
    }));

  return (
    <div className="w-full lg:w-80 flex-shrink-0">
      <aside className="hidden md:block col-span-1">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">🎉 Sự kiện sắp diễn ra</h2>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event: any) => (
              <div
                key={event._id}
                className="mb-6 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => setLocation(`/events/${event._id}`)}
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">{event.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-4">
                    <LocationMarkerIcon className="w-5 h-5 mr-2" />
                    <span>{event.location?.physical?.address + ' - ' + event.location?.physical?.room || 'Địa điểm không xác định'}</span>
                  </div>
                </div>
                <div 
                  className="mt-4 right-0 flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <JoinEventButton
                    eventId={event._id}
                    participants={event.participants}
                    onJoinSuccess={() => {
                      updateEventParticipants(event._id, user?._id, true);
                    }}
                    onLeaveSuccess={() => {
                      updateEventParticipants(event._id, user?._id, false);
                    }}
                  />
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
