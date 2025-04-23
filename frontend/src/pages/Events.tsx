import React, { useEffect, useState } from 'react';
import TopBar from '../components/Footer';
import Header from '../components/Header';
import eventService from '../services/eventService';

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventService.getAllEvents();
        setEvents(Array.isArray(data) ? data : []); // Ensure data is an array
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <Header />

      {/* Event Filters */}
      <section className="container mx-auto mt-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="event-type" className="block text-sm font-medium text-gray-600">
                Loại sự kiện
              </label>
              <select
                id="event-type"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Tất cả loại</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Hội thảo</option>
                <option value="competition">Cuộc thi</option>
                <option value="club">Hoạt động CLB</option>
                <option value="career">Việc làm</option>
              </select>
            </div>
            <div>
              <label htmlFor="organizer" className="block text-sm font-medium text-gray-600">
                Đơn vị tổ chức
              </label>
              <select
                id="organizer"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">Tất cả đơn vị</option>
                <option value="it">Khoa CNTT</option>
                <option value="business">Khoa Quản trị kinh doanh</option>
                <option value="youth-union">Đoàn Thanh niên</option>
                <option value="skill-club">CLB Kỹ năng</option>
              </select>
            </div>
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-600">
                Từ ngày
              </label>
              <input
                type="date"
                id="date-from"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-600">
                Đến ngày
              </label>
              <input
                type="date"
                id="date-to"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-4">
            <button className="px-4 py-2 border border-orange-600 text-orange-600 rounded-md hover:bg-orange-100">
              Đặt lại
            </button>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
              Áp dụng
            </button>
          </div>
        </div>
      </section>

      {/* Event Grid */}
      <section className="container mx-auto mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {events.length > 0 ? (
            events.map((event) => (
              <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gray-200">
                  <img
                    src={event.image[0]?.url || '/placeholder.jpg'}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src="/api/placeholder/30/30"
                      alt={event.organizer.fullName}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-gray-600">{event.organizer.fullName}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-orange-600">{event.title}</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <i className="far fa-calendar text-orange-600"></i>
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <i className="far fa-clock text-orange-600"></i>
                      <span>{new Date(event.startDate).toLocaleTimeString()} - {new Date(event.endDate).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <i className="fas fa-map-marker-alt text-orange-600"></i>
                      <span>{event.eventType === 'offline' ? event.location.physical.address : 'Online'}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">{event.participants.length} người tham gia</span>
                    <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                      Tham gia
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Không có sự kiện nào để hiển thị.</p>
          )}
        </div>
      </section>

      {/* Create Event Button */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 flex items-center justify-center text-2xl">
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default Events;
