import React, { useEffect, useState } from 'react';
import TopBar from '../components/Footer';
import Header from '../components/Header';
import eventService from '../services/eventService';
import { Event } from '../types';
import { IoCalendarOutline, IoTimeOutline, IoPeopleOutline, IoLocationOutline, IoDesktopOutline } from 'react-icons/io5';
import EventLocation from '../components/EventLocation';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-orange-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }} />
        </div>
        <div className="container mx-auto px-4 relative">
          <span className="inline-block py-1 px-3 bg-orange-500 rounded-full text-sm mb-4">Sự kiện</span>
          <h1 className="text-5xl font-bold mb-4 leading-tight">Sự Kiện Nổi Bật</h1>
          <p className="text-xl opacity-90 max-w-2xl">Khám phá các sự kiện thú vị đang diễn ra tại HUTECH</p>
        </div>
      </div>

      {/* Event Filters */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label htmlFor="event-type" className="text-sm font-semibold text-gray-700">
                  Loại sự kiện
                </label>
                <select
                  id="event-type"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                >
                  <option value="">Tất cả loại</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Hội thảo</option>
                  <option value="competition">Cuộc thi</option>
                  <option value="club">Hoạt động CLB</option>
                  <option value="career">Việc làm</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="organizer" className="text-sm font-semibold text-gray-700">
                  Đơn vị tổ chức
                </label>
                <select
                  id="organizer"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                >
                  <option value="">Tất cả đơn vị</option>
                  <option value="it">Khoa CNTT</option>
                  <option value="business">Khoa Quản trị kinh doanh</option>
                  <option value="youth-union">Đoàn Thanh niên</option>
                  <option value="skill-club">CLB Kỹ năng</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="date-from" className="text-sm font-semibold text-gray-700">
                  Từ ngày
                </label>
                <input
                  type="date"
                  id="date-from"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="date-to" className="text-sm font-semibold text-gray-700">
                  Đến ngày
                </label>
                <input
                  type="date"
                  id="date-to"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-4">
              <button className="px-6 py-2.5 border-2 border-orange-600 text-orange-600 rounded-xl hover:bg-orange-50 transition-all duration-200 font-medium hover:shadow-sm">
                Đặt lại
              </button>
              <button className="px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium">
                Áp dụng
              </button>
            </div>
          </div>
        </div>

        {/* Event Grid */}
        <div className="mt-12 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event._id} 
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1 flex flex-col h-[600px]"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full">
                        {event.eventType === 'offline' ? 'Offline' : 'Online'}
                      </span>
                    </div>
                    <img
                      src={event.images?.[0]?.url || 'https://scontent.fsgn8-2.fna.fbcdn.net/v/t39.30808-6/473137314_1284976742773215_4764655058071517890_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeEd4g18joMkpFlTzygD1uffDY8AddM8W5INjwB10zxbkoB7vhesqnuPMCgnOD8oCY-GN7krq8MN4yBytLkI8xnt&_nc_ohc=BLrSDxe4GuwQ7kNvwFmSnsz&_nc_oc=AdnQHzsUpF-jMtsAgz1IYekFy5_C6aYL8-Ff61ZvBL8P-IZngyXyipam-KPnCB52FCU&_nc_zt=23&_nc_ht=scontent.fsgn8-2.fna&_nc_gid=cRUcC9QT5CfuYSqpDwIJfQ&oh=00_AfGw_hvo4SzRHKP9zGid6g1olu4tchLb3w0sQ2ioAkNy_Q&oe=68105B85'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center space-x-3 mb-4">
                      <img
                        src={event.organizer?.avatar?.url || '/placeholder.jpg'}
                        alt={event.organizer?.fullName}
                        className="w-10 h-10 rounded-full border-2 border-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.jpg';
                        }}
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900">{event.organizer?.fullName}</span>
                        <p className="text-xs text-gray-500">Đơn vị tổ chức</p>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors mb-4 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="space-y-3 text-sm text-gray-600 flex-1">
                      <div className="flex items-center space-x-3">
                        <IoCalendarOutline className="text-orange-500 w-4 h-4" />
                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <IoTimeOutline className="text-orange-500 w-4 h-4" />
                        <span>{new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      {(event.eventType === 'offline' || event.eventType === 'hybrid') && 
                        event.location?.physical?.address && (
                          <div className="flex items-center space-x-3">
                            <IoLocationOutline className="text-orange-500 w-4 h-4" />
                            <span className="truncate">
                              {event.location.physical.room 
                                ? `${event.location.physical.address} - ${event.location.physical.room}`
                                : event.location.physical.address}
                            </span>
                          </div>
                      )}
                      {(event.eventType === 'online' || event.eventType === 'hybrid') && 
                        event.location?.online?.platform && (
                          <div className="flex items-center space-x-3">
                            <IoDesktopOutline className="text-orange-500 w-4 h-4" />
                            <span className="truncate">
                              {event.location.online.platform} Meeting
                            </span>
                          </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-gray-500 flex items-center space-x-2">
                        <IoPeopleOutline className="text-orange-500 w-4 h-4" />
                        <span>{event.participants.length} người tham gia</span>
                      </span>
                      <button className="px-5 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 text-sm font-medium hover:shadow-md">
                        Tham gia ngay
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16">
                <i className="fas fa-calendar-times text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">Không có sự kiện nào để hiển thị.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Event Button */}
      <button className="fixed bottom-8 right-8 w-16 h-16 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-2xl">
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default Events;
