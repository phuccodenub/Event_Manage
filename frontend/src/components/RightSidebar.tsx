import React, { useEffect, useState } from 'react';
import { CalendarIcon, LocationMarkerIcon } from '@heroicons/react/outline'; // Replace MapPinIcon with LocationMarkerIcon
import eventService from '../services/eventService';
import Footer from './Footer';

const RightSidebar: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      const allEvents = await eventService.getAllEvents();
      const now = new Date();
      const filteredEvents = allEvents
        .filter((event: any) => new Date(event.startDate) > now) // Filter events with startDate in the future
        .map((event: any) => ({
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
          })}`, // Format startDate and endDate for display
        }));
      setUpcomingEvents(filteredEvents.slice(0, 2)); // Limit to 2 events
    };

    fetchUpcomingEvents();
  }, []);

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
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{event.title}</h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-4">
                  <LocationMarkerIcon className="w-5 h-5 mr-2" /> {/* Updated icon */}
                  <span>{event.location?.physical?.address || 'Địa điểm không xác định'}</span>
                </div>
                <button className="w-full text-sm text-white bg-orange-600 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors">
                  Tham gia
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center">Không có sự kiện nào sắp diễn ra.</p>
          )}
        </div>
      </aside>

      {/* Footer */}
      <Footer />

      {/* Mobile View */}

    </div>
  );
};

export default RightSidebar;
