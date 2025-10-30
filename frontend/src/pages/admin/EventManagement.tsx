import { useState, useEffect } from 'react';
import { 
  CalendarIcon, PencilAltIcon, TrashIcon, SearchIcon,
  ClockIcon, ArrowRightIcon,
  DocumentTextIcon, LocationMarkerIcon, AcademicCapIcon, StatusOnlineIcon, UserGroupIcon
} from '@heroicons/react/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import eventService from '@/services/eventService';
import EventViewModal from '@/components/admin/events/EventViewModal';
import AddEventModal from '@/components/admin/events/AddEventModal';
import EditEventModal from '@/components/admin/events/EditEventModal';
import DeleteEventModal from '@/components/admin/events/DeleteEventModal';
import { toast } from 'react-toastify';
import type { Event } from '@/types';
import { useEvents } from '@/context/EventContext';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterState {
  search: string;
  status: string;
  type: string;
  department: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const EVENT_TYPES = {
  all: 'Tất cả hình thức',
  offline: 'Trực tiếp',
  online: 'Trực tuyến',
  hybrid: 'Kết hợp'
};

const STATUS_OPTIONS = {
  all: 'Tất cả trạng thái',
  upcoming: 'Sắp diễn ra',
  ongoing: 'Đang diễn ra',
  completed: 'Đã hoàn thành'
};

const COLUMN_WIDTHS = {
  title: 'w-[300px] min-w-[300px] max-w-[300px]',
  time: 'w-[180px] min-w-[180px] max-w-[180px]',
  location: 'w-[200px] min-w-[200px] max-w-[200px]',
  department: 'w-[80px] min-w-[80px] max-w-[80px]',
  status: 'w-[120px] min-w-[120px] max-w-[120px]',
  participants: 'w-[120px] min-w-[120px] max-w-[120px]',
  actions: 'w-[100px] min-w-[100px] max-w-[100px]'
};

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

const formatDateTime = (event: Event) => {
  if (!event.eventDays || !event.eventDays[0]) return 'N/A';
  
  const eventDay = event.eventDays[0];
  const date = new Date(eventDay.date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  if (!eventDay.sessions || eventDay.sessions.length === 0) return date;
  
  const sessions = eventDay.sessions.map(session => 
    `${session.label}: ${session.startTime} - ${session.endTime}`
  ).join('\n');
  
  return `${date}\n${sessions}`;
};

const sortEvents = (events: Event[]) => {
  return events.sort((a, b) => {
    // Ưu tiên trạng thái
    const statusPriority = {
      ongoing: 2,
      upcoming: 1,
      completed: 0
    };

    const statusA = a.status as keyof typeof statusPriority;
    const statusB = b.status as keyof typeof statusPriority;

    if (statusA !== statusB) {
      return statusPriority[statusB] - statusPriority[statusA];
    }    // Nếu cùng trạng thái thì sắp xếp theo thời gian tạo mới nhất
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
};

const EventManagement = () => {
  const { events, loading, error, fetchEvents } = useEvents();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    type: 'all',
    department: 'all',
    dateRange: {
      start: null,
      end: null
    }
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const eventsPerPage = 10;

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = events.filter(event => {
    const searchQuery = filters.search.toLowerCase();
    const matchesSearch = !searchQuery || [
      event.title,
      event.description,
      event.location?.physical?.address,
      event.department?.name,
      event.organizer?.fullName
    ].some(field => field?.toLowerCase().includes(searchQuery));

    const matchesStatus = filters.status === 'all' || event.status === filters.status;
    const matchesType = filters.type === 'all' || event.eventType === filters.type;
    const matchesDepartment = filters.department === 'all' || event.department?._id === filters.department;    const matchesDate = (!filters.dateRange.start || (event.startDate && new Date(event.startDate) >= filters.dateRange.start)) &&
                       (!filters.dateRange.end || (event.startDate && new Date(event.startDate) <= filters.dateRange.end));

    return matchesSearch && matchesStatus && matchesType && matchesDepartment && matchesDate;
  });

  const paginatedEvents = sortEvents(filteredEvents).slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await eventService.deleteEvent(eventId);
      toast.success('Xóa sự kiện thành công');
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa sự kiện');
    }
  };

  const handleEditEvent = async (id: string, eventData: any) => {
    try {
      await eventService.updateEvent(id, eventData);
      toast.success('Cập nhật sự kiện thành công');
      setIsEditModalOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật sự kiện');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-96">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarIcon className="h-5 w-5" />
          Tạo sự kiện
        </button>
        <p className="text-gray-500 mt-1">Tổng số: {events.length} sự kiện</p>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/4 text-orange-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
              className="text-orange-600 w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 
                transition-all placeholder:text-orange-300"
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Status Filter */}
          <select
            className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            {Object.entries(STATUS_OPTIONS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Event Type Filter */}
          <select
            className="text-orange-600 w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all"
            value={filters.type}
            onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
          >
            {Object.entries(EVENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          {/* Date Range Picker */}
          <div className="flex gap-2">
            <DatePicker
              selected={filters.dateRange.start}
              onChange={(date) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: date }
              }))}
              selectsStart
              startDate={filters.dateRange.start}
              endDate={filters.dateRange.end}
              dateFormat="dd/MM/yyyy"
              placeholderText="Từ ngày"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <DatePicker
              selected={filters.dateRange.end}
              onChange={(date) => setFilters(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: date }
              }))}
              selectsEnd
              startDate={filters.dateRange.start}
              endDate={filters.dateRange.end}
              minDate={filters.dateRange.start || undefined}
              dateFormat="dd/MM/yyyy"
              placeholderText="Đến ngày"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Active Filters */}
        {Object.values(filters).some(value => 
          value !== 'all' && value !== '' && 
          (typeof value === 'object' ? Object.values(value).some(v => v !== null) : true)
        ) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-gray-500">Bộ lọc đang áp dụng:</span>
            <button
              onClick={() => setFilters({
                search: '',
                status: 'all',
                type: 'all',
                department: 'all',
                dateRange: { start: null, end: null }
              })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full whitespace-nowrap table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.title}`}>
                Tên sự kiện
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.time}`}>
                Thời gian
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.location}`}>
                Địa điểm
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.department}`}>
                Khoa
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.status}`}>
                Trạng thái
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.participants}`}>
                Số người tham gia
              </th>
              <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${COLUMN_WIDTHS.actions}`}>
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <AnimatePresence>
              {paginatedEvents.map((event, index) => (
                <motion.tr
                  key={event._id}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ 
                    type: "spring",
                    delay: index * 0.1,
                    duration: 0.5 
                  }}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <td className={`px-6 py-4 ${COLUMN_WIDTHS.title}`}>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="truncate" title={event.title}>
                          {truncateText(event.title, 40)}
                        </div>
                        {event.images && event.images.length > 0 && (
                          <div className="text-xs text-orange-600 mt-1">
                            {event.images.length} ảnh đính kèm
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${COLUMN_WIDTHS.time}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-gray-600">
                        <ClockIcon className="h-4 w-4 text-orange-500" />
                        <div className="whitespace-pre-line">
                          {formatDateTime(event)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${COLUMN_WIDTHS.location}`}>
                    <div className="flex items-center gap-2">
                      <LocationMarkerIcon className="h-4 w-4 text-orange-500" />
                      <div className="truncate" title={event.location?.physical?.address}>
                        {event.location?.physical 
                          ? truncateText(`${event.location.physical.address}${event.location.physical.room ? ` - Phòng ${event.location.physical.room}` : ''}`, 25)
                          : 'Online'}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${COLUMN_WIDTHS.department}`}>
                    <div className="flex items-center gap-2">
                      <AcademicCapIcon className="h-4 w-4 text-orange-500" />
                      <div className="truncate">
                        {event.department?.name || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${COLUMN_WIDTHS.status}`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status === 'upcoming' ? 'Sắp diễn ra' :
                        event.status === 'ongoing' ? 'Đang diễn ra' :
                        'Đã hoàn thành'}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${COLUMN_WIDTHS.participants}`}>
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="h-4 w-4 text-orange-500" />
                      <div className="truncate">
                        {event.participants?.length || 0}
                        {event.capacity ? `/${event.capacity}` : <span className="ml-1"> / ∞</span>}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${COLUMN_WIDTHS.actions}`}>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <PencilAltIcon className="h-5 w-5 text-gray-600" />
                      </button>
                      <button 
                        className="p-1 hover:bg-gray-100 rounded"
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <TrashIcon className="h-5 w-5 text-red-600" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Add Modals */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <EditEventModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleEditEvent}
        event={selectedEvent}
      />

      <DeleteEventModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
      />

      <EventViewModal
        isOpen={!!selectedEvent && !isEditModalOpen && !isDeleteModalOpen}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Hiển thị {filteredEvents.length > 0 ? (currentPage - 1) * eventsPerPage + 1 : 0} - {Math.min(currentPage * eventsPerPage, filteredEvents.length)} trong số {filteredEvents.length} sự kiện
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(prev => prev - 1)}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          <button
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={currentPage >= totalPages}
          >
            Tiếp
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
