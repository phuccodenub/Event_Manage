import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import Footer from '../components/Footer';
import eventService from '../services/eventService';

const Home: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAllEvents();
        setEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F2EF] flex flex-col font-sans">
      {/* Sticky Header */}
      <Header />

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 px-4 flex-grow">
        {/* Left Sidebar (Sticky on Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-16 h-fit">
          <LeftSidebar />
        </aside>

        {/* Main Feed */}
        <section className="col-span-1 lg:col-span-6">
          {events.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h2 className="text-lg font-semibold text-[#000000]">Welcome to HUTECH Events!</h2>
              <p className="text-sm text-[#666666] mt-2">
                Discover exciting events and connect with the student community.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Organizer Info */}
                  <div className="flex items-center p-4 border-b border-[#EDEDED]">
                    <img
                      src={event.organizer.avatar || '/placeholder-avatar.jpg'}
                      alt={event.organizer.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-[#000000]">
                        {event.organizer.fullName}
                      </h3>
                      <p className="text-xs text-[#666666]">
                        {new Date(event.startDate).toLocaleDateString()} •{' '}
                        {event.eventType === 'offline'
                          ? event.location.physical.address
                          : 'Online'}
                      </p>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-4">
                    <h2 className="text-base font-semibold text-[#000000]">{event.title}</h2>
                    <p className="text-sm text-[#666666] mt-2 line-clamp-3">{event.description}</p>

                    {/* Event Image with Placeholder */}
                    <img
                      src={event.image[0]?.url || 'https://res.cloudinary.com/djnrbhakc/image/upload/v1743940680/slayla-boutique/product-images/nihmqutmnhwzb4wylrb3.jpg'}
                      alt={event.title}
                      className="w-full h-72 object-cover mt-3 rounded"
                    />

                    {/* Event Stats */}
                    <div className="flex justify-between items-center mt-3 text-xs text-[#666666]">
                      <span>{event.participants.length} attendees</span>
                      <span>{event.collaborators.length} collaborators</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-4 border-t border-[#EDEDED] pt-3">
                      <button className="flex-1 py-1.5 bg-[#0A66C2] text-white text-sm rounded hover:bg-[#004B87] transition-colors">
                        Join
                      </button>
                      <button className="flex-1 py-1.5 bg-white text-[#666666] text-sm rounded border border-[#666666] hover:bg-[#F3F2EF] transition-colors">
                        Follow
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Sidebar (Sticky on Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-16 h-fit">
          <RightSidebar />
        </aside>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;