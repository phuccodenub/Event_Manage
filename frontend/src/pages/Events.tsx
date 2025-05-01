import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import Header from '../components/Header';
import eventService from '../services/eventService';
import { Event } from '../types';
import { IoCalendarOutline, IoTimeOutline, IoPeopleOutline, IoLocationOutline, IoDesktopOutline } from 'react-icons/io5';
import JoinEventButton from '../components/JoinEventButton';
import { SearchIcon } from '@heroicons/react/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
        const data = await eventService.getAllEvents();
        setEvents(Array.isArray(data) ? data : []);
        setFilteredEvents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching events:', error);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search Input */}
              <div className="relative lg:col-span-2">
                <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/4 text-orange-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sự kiện..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>

              {/* Event Type */}
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                {Object.entries(EVENT_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {/* Category */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                {Object.entries(CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {/* Status */}
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

            {/* Date Range Picker */}
            <div className="flex gap-4 mt-4">
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
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
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Active Filters */}
            {Object.values(filters).some(value => 
              value !== 'all' && value !== '' && 
              (typeof value === 'object' ? Object.values(value).some(v => v !== null) : true)
            ) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">Bộ lọc đang áp dụng</span>
                <button
                  onClick={resetFilters}
                  className="text-sm text-orange-600 hover:text-orange-800"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Event Grid */}
        <div className="mt-12 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event._id} 
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-1 flex flex-col h-[600px]"
                >
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <div className="absolute top-3 right-3 z-10">
                      <span className="bg-orange-600 text-white text-xs px-3 py-1 rounded-full">
                        {EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES].replace('Tất cả hình thức', '')}
                      </span>
                    </div>
                    <img
                      src={event.images?.[0]?.url || '/default.svg'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/default.svg';
                      }}
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center space-x-3 mb-4">
                      <img
                        src={event.organizer?.avatar?.url || '/default.svg'}
                        alt={event.organizer?.fullName}
                        className="w-10 h-10 rounded-full border-2 border-gray-100"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/default.svg';
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
                      <JoinEventButton
                        eventId={event._id}
                        participants={event.participants}
                        startDate={event.startDate}
                        endDate={event.endDate}
                        status={getEventStatus(event.startDate, event.endDate)}
                        onJoinSuccess={() => {
                          updateEventParticipants(event._id, user?._id, true);
                        }}
                        onLeaveSuccess={() => {
                          updateEventParticipants(event._id, user?._id, false);
                        }}
                      />
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
