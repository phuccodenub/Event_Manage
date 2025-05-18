import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import Header from '../components/Header';
import eventService from '../services/eventService';
import { Event } from '../types';
import { 
  IoCalendarOutline, 
  IoTimeOutline, 
  IoPeopleOutline, 
  IoLocationOutline, 
  IoDesktopOutline,
  IoImageOutline,
  IoFilterOutline,
  IoCloseOutline,
  IoAdd
} from 'react-icons/io5';
import JoinEventButton from '../components/JoinEventButton';
import { SearchIcon } from '@heroicons/react/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLocation } from 'wouter';
import LoadingSpinner from '../components/LoadingSpinner';

const EVENT_TYPES = {
  all: 'Tất cả hình thức',
  offline: 'Offline',
  online: 'Online',
  hybrid: 'Hybrid'
};

const STATUS_OPTIONS = {
  all: 'Tất cả trạng thái',
  upcoming: 'Sắp diễn ra',
  ongoing: 'Đang diễn ra',
  completed: 'Đã hoàn thành'
};

const CATEGORIES = {
  all: 'Tất cả loại',
  academic: 'Học thuật',
  cultural: 'Văn hóa'
};

const getEventStatus = (startDate: string, endDate: string): string => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'ongoing';
  } else {
    return 'completed';
  }
};

const Events: React.FC = () => {
  const { user } = useAuth();
  const { events, setEvents, updateEventParticipants } = useEvents();
  const [filteredEvents, setFilteredEvents] = useState(events);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    eventType: 'all',
    category: 'all',
    dateRange: {
      start: null as Date | null,
      end: null as Date | null
    }
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await eventService.getAllEvents();
        setEvents(Array.isArray(data) ? data : []);
        setFilteredEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [setEvents]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      eventType: 'all',
      category: 'all',
      dateRange: {
        start: null,
        end: null
      }
    });
    setFilteredEvents(events);
  };

  const applyFilters = () => {
    let filtered = [...events].map(event => ({
      ...event,
      status: getEventStatus(event.startDate, event.endDate)
    }));

    if (filters.search) {
      const searchQuery = filters.search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery) ||
        event.description.toLowerCase().includes(searchQuery) ||
        event.location?.physical?.address?.toLowerCase().includes(searchQuery) ||
        event.department?.name?.toLowerCase().includes(searchQuery)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    if (filters.eventType !== 'all') {
      filtered = filtered.filter(event => event.eventType === filters.eventType);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status);
    }

    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        const matchesStart = !filters.dateRange.start || eventDate >= filters.dateRange.start;
        const matchesEnd = !filters.dateRange.end || eventDate <= filters.dateRange.end;
        return matchesStart && matchesEnd;
      });
    }

    setFilteredEvents(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, events]);

  // Function to handle clicking on an event card
  const handleEventClick = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  // Get badge color based on event status
  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'upcoming':
        return 'bg-blue-500';
      case 'ongoing':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-orange-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {loading ? (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
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

          {/* Search Section */}
          <div className="container mx-auto px-4">
            <div className="relative -mt-8 mb-10">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full sm:w-auto flex-grow">
                    <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sự kiện..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setFiltersVisible(!filtersVisible)}
                    className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-lg transition-all w-full sm:w-auto justify-center"
                  >
                    <IoFilterOutline />
                    <span>Bộ lọc</span>
                    {Object.values(filters).some(value => 
                      value !== 'all' && value !== '' && 
                      (typeof value === 'object' ? Object.values(value).some(v => v !== null) : true)
                    ) && (
                      <span className="bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        !
                      </span>
                    )}
                  </button>
                </div>

                {/* Filter Panel */}
                {filtersVisible && (
                  <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức</label>
                      <select
                        value={filters.eventType}
                        onChange={(e) => handleFilterChange('eventType', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      >
                        {Object.entries(EVENT_TYPES).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                      <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      >
                        {Object.entries(CATEGORIES).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      >
                        {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <DatePicker
                          selected={filters.dateRange.start}
                          onChange={(date) => handleFilterChange('dateRange', {
                            ...filters.dateRange,
                            start: date
                          })}
                          selectsStart
                          startDate={filters.dateRange.start}
                          endDate={filters.dateRange.end}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Từ ngày"
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                        <DatePicker
                          selected={filters.dateRange.end}
                          onChange={(date) => handleFilterChange('dateRange', {
                            ...filters.dateRange,
                            end: date
                          })}
                          selectsEnd
                          startDate={filters.dateRange.start}
                          endDate={filters.dateRange.end}
                          minDate={filters.dateRange.start}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Đến ngày"
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Reset Filters */}
                    <div className="sm:col-span-2 lg:col-span-4 mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all"
                      >
                        <IoCloseOutline />
                        <span>Xóa bộ lọc</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Results Section */}
          <div className="container mx-auto px-4 pb-20">
            {/* Results Count */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {filteredEvents.length} sự kiện được tìm thấy
              </h2>
              <span className="text-sm text-gray-500">
                Hiển thị {filteredEvents.length} / {events.length} sự kiện
              </span>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const hasImage = event.images && event.images.length > 0 && event.images[0]?.url;
                  const eventStatus = getEventStatus(event.startDate, event.endDate);
                  const statusColor = getStatusBadgeColor(eventStatus);
                  
                  return (
                    <div 
                      key={event._id}
                      onClick={() => handleEventClick(event._id)}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 overflow-hidden flex flex-col cursor-pointer"
                    >
                      {/* Image Section */}
                      {hasImage ? (
                        <div className="aspect-video relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 to-transparent z-10" />
                          <img
                            src={event.images[0].url}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 z-20">
                            <span className={`${statusColor} text-white text-xs px-3 py-1 rounded-full capitalize`}>
                              {STATUS_OPTIONS[eventStatus as keyof typeof STATUS_OPTIONS].replace('Tất cả trạng thái', '')}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3 z-20">
                            <span className="bg-white/90 text-gray-700 text-xs px-3 py-1 rounded-full">
                              {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].replace('Tất cả hình thức', '')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video relative bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                          <IoImageOutline className="text-orange-300 text-5xl" />
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`${statusColor} text-white text-xs px-3 py-1 rounded-full capitalize`}>
                              {STATUS_OPTIONS[eventStatus as keyof typeof STATUS_OPTIONS].replace('Tất cả trạng thái', '')}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className="bg-white/90 text-gray-700 text-xs px-3 py-1 rounded-full">
                              {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].replace('Tất cả hình thức', '')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Content Section */}
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Organizer */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs text-orange-600 font-bold">
                            {event.organizer?.fullName?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm text-gray-600 truncate">
                            {event.organizer?.fullName || 'Unknown'} {event.department?.name ? `• ${event.department.name}` : ''}
                          </span>
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                          {event.title}
                        </h3>
                        
                        {/* Event Details */}
                        <div className="space-y-2 text-sm text-gray-600 flex-1">
                          <div className="flex items-center gap-2">
                            <IoCalendarOutline className="text-orange-500 w-4 h-4 flex-shrink-0" />
                            <span>{new Date(event.startDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <IoTimeOutline className="text-orange-500 w-4 h-4 flex-shrink-0" />
                            <span>
                              {new Date(event.startDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} - 
                              {new Date(event.endDate).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          
                          {/* Location - show only one based on event type */}
                          {(event.eventType === 'offline' || event.eventType === 'hybrid') && 
                            event.location?.physical?.address && (
                              <div className="flex items-center gap-2">
                                <IoLocationOutline className="text-orange-500 w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                  {event.location.physical.room 
                                    ? `${event.location.physical.address} - ${event.location.physical.room}`
                                    : event.location.physical.address}
                                </span>
                              </div>
                          )}
                          
                          {event.eventType === 'online' && event.location?.online?.platform && (
                            <div className="flex items-center gap-2">
                              <IoDesktopOutline className="text-orange-500 w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                {event.location.online.platform} Meeting
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <IoPeopleOutline className="text-orange-500 w-4 h-4" />
                            <span>{event.participants.length}</span>
                          </span>
                          
                          {/* Join Button */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <JoinEventButton
                              eventId={event._id}
                              participants={event.participants}
                              startDate={event.startDate}
                              endDate={event.endDate}
                              status={eventStatus}
                              onJoinSuccess={() => updateEventParticipants(event._id, user?._id, true)}
                              onLeaveSuccess={() => updateEventParticipants(event._id, user?._id, false)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-16 text-center">
                  <div className="bg-orange-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                    <IoCalendarOutline className="text-orange-500 text-3xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sự kiện</h3>
                  <p className="text-gray-500 mb-6">Không có sự kiện nào phù hợp với bộ lọc của bạn.</p>
                  <button
                    onClick={resetFilters}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Create Event Button (for admin) */}
          {user?.role === 'admin' && (
            <button className="fixed bottom-8 right-8 w-14 h-14 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 hover:shadow-xl transition-all flex items-center justify-center">
              <IoAdd className="text-2xl" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
