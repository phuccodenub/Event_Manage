import React, { useEffect, useState, useCallback } from 'react';
import { MdImage, MdEdit, MdDelete, MdContentCopy, MdPushPin, MdInfoOutline } from 'react-icons/md';
import { BiCalendarEvent } from 'react-icons/bi';
import { IoLocationOutline, IoDesktopOutline, IoRefreshOutline } from 'react-icons/io5';
import { BsThreeDotsVertical, BsCalendarEvent, BsCalendarCheck } from 'react-icons/bs';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import eventService from '../services/eventService';
import announcementService from '../services/announcementService';
import CreateEventModal from '../components/modals/CreateEventModal';
import EventImageGrid from '../components/EventImageGrid';
import EditEventModal from '../components/modals/EditEventModal';
import EditAnnouncementModal from '../components/modals/EditAnnouncementModal';
import { Event, Announcement } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEvents } from '../context/EventContext';
import JoinEventButton from '../components/JoinEventButton';
import CollaborateEventButton from '../components/CollaborateEventButton';
import { formatDescriptionWithLinks } from '@/utils/linkUtils';
import { getSafeAvatarUrl } from '@/utils/avatarUtils';
import { UserIcon } from '@heroicons/react/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  getEventStartDate, 
  getEventEndDate, 
  getEventStatusFromEventDays, 
  formatEventDaysDisplay, 
  formatEventTimeDisplay,
  formatDate
} from '../utils/dateUtils';
import { FiPlus, FiRefreshCw, FiClock, FiMapPin, FiEdit2, FiTrash2, FiMoreHorizontal } from 'react-icons/fi';

// Define cache keys
const CACHE_KEYS = {
  EVENTS: 'home_events_cache',
  ANNOUNCEMENTS: 'home_announcements_cache',
  LAST_FETCH: 'home_last_fetch_time'
};

// Cache expiry time (5 minutes in milliseconds)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

// This function clears all caches to force a full refresh
const clearAllCaches = () => {
  // Clear Home cache
  localStorage.removeItem(CACHE_KEYS.EVENTS);
  localStorage.removeItem(CACHE_KEYS.ANNOUNCEMENTS);
  localStorage.removeItem(CACHE_KEYS.LAST_FETCH);
  
  // Clear LeftSidebar cache
  localStorage.removeItem('left_sidebar_user_details_cache');
  localStorage.removeItem('left_sidebar_certificates_cache');
  localStorage.removeItem('left_sidebar_last_fetch_time');
  
  // Clear RightSidebar cache
  localStorage.removeItem('right_sidebar_events_cache');
  localStorage.removeItem('right_sidebar_last_fetch_time');
};

const Home: React.FC = () => {
  const { events, setEvents, updateEventParticipants } = useEvents();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [isCachedData, setIsCachedData] = useState(false);

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const sortEvents = (events: Event[]) => {
    const now = new Date();
    return events.sort((a, b) => {
      const startDateA = a.eventDays ? getEventStartDate(a.eventDays) : null;
      const startDateB = b.eventDays ? getEventStartDate(b.eventDays) : null;
      
      if (!startDateA && !startDateB) return 0;
      if (!startDateA) return 1;
      if (!startDateB) return -1;
      
      const isUpcomingA = startDateA > now;
      const isUpcomingB = startDateB > now;

      // Sort by upcoming status first
      if (isUpcomingA && !isUpcomingB) return -1;
      if (!isUpcomingA && isUpcomingB) return 1;

      // If both are upcoming, sort by nearest start date
      if (isUpcomingA && isUpcomingB) {
        return startDateA.getTime() - startDateB.getTime();
      }

      // If neither are upcoming, sort by creation date (newest first)
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  };

  const formatEventDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const formatTimeAgo = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: vi // Sử dụng tiếng Việt
    });
  };

  const handleTimeClick = (post: Event | Announcement) => {
    if ('eventDays' in post) {
      navigate(`/events/${post._id}`);
    } else {
      navigate(`/announcements/${post._id}`);
    }
  };

  const toggleDescription = (eventId: string) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Function to check if cache is still valid
  const isCacheValid = (): boolean => {
    const lastFetchTime = localStorage.getItem(CACHE_KEYS.LAST_FETCH);
    
    if (!lastFetchTime) {
      return false;
    }

    const lastFetch = parseInt(lastFetchTime, 10);
    const now = Date.now();
    
    // Cache is valid if less than CACHE_EXPIRY_TIME has passed
    return now - lastFetch < CACHE_EXPIRY_TIME;
  };

  // Function to fetch content from the API
  const fetchContent = useCallback(async (forceRefresh = false) => {
    // Always update the last access time
    localStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString());
    
    // Try to use cached data if appropriate
    if (!forceRefresh && isCacheValid()) {
      try {
        const cachedEvents = localStorage.getItem(CACHE_KEYS.EVENTS);
        const cachedAnnouncements = localStorage.getItem(CACHE_KEYS.ANNOUNCEMENTS);
        
        if (cachedEvents && cachedAnnouncements) {
          setEvents(JSON.parse(cachedEvents));
          setAnnouncements(JSON.parse(cachedAnnouncements));
          setIsCachedData(true);
          return;
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
        // If there's an error with the cache, proceed to fetch from API
      }
    }

    try {
      setIsLoading(true);
      const [fetchedEvents, fetchedAnnouncements] = await Promise.all([
        eventService.getAllEvents(),
        announcementService.getAllAnnouncements()
      ]);

      // Filter active announcements and sort by priority
      const activeAnnouncements = fetchedAnnouncements.filter(
        announcement => announcement.status === 'active'
      ).sort((a, b) => {
        // Sort by priority first
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        // Then by creation date
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      // Ensure participants are mapped correctly
      const formattedEvents = fetchedEvents.map((event: any) => ({
        ...event,
        participants: event.participants.map((p: any) => 
          typeof p === 'string' ? p : p._id.toString()
        ),
        registrationForm: event.registrationForm || undefined
      }));

      const sortedEvents = sortEvents(formattedEvents);
      
      setAnnouncements(activeAnnouncements);
      setEvents(sortedEvents);
      setError(null);
      setIsCachedData(false);

      // Save to cache
      try {
        localStorage.setItem(CACHE_KEYS.EVENTS, JSON.stringify(sortedEvents));
        localStorage.setItem(CACHE_KEYS.ANNOUNCEMENTS, JSON.stringify(activeAnnouncements));
      } catch (cacheError) {
        console.error('Error saving to cache:', cacheError);
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error fetching content');
    } finally {
      setIsLoading(false);
    }
  }, [setEvents]);

  // Function to force a full refresh of all components
  const handleForceRefresh = () => {
    clearAllCaches();
    fetchContent(true);
    window.location.reload(); // Force reload of the page to refresh all components
  };

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePostEvent = async (eventData: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Submitting event with data:', {
        title: eventData.get('title'),
        description: eventData.get('description'),
        images: eventData.get('images'),
      });

      const newEvent = await eventService.createEvent(eventData);
      console.log('Event created successfully:', newEvent);
      
      // Sort events when adding new event
      setEvents(prevEvents => sortEvents([newEvent, ...prevEvents]));
      setIsModalOpen(false);
      
      // Update cache with new event
      try {
        const cachedEvents = localStorage.getItem(CACHE_KEYS.EVENTS);
        if (cachedEvents) {
          const parsedEvents = JSON.parse(cachedEvents);
          localStorage.setItem(CACHE_KEYS.EVENTS, JSON.stringify(sortEvents([newEvent, ...parsedEvents])));
        }
      } catch (cacheError) {
        console.error('Error updating cache:', cacheError);
      }
    } catch (error: any) {
      console.error('Error details:', error);
      setError(error.response?.data?.message || 'Error creating event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id: string, type: 'event' | 'announcement') => {
    try {
      if (type === 'event') {
        await eventService.deleteEvent(id);
        setEvents(prev => prev.filter(event => event._id !== id));
        toast.success('Đã xóa sự kiện thành công');
      } else {
        await announcementService.deleteAnnouncement(id);
        setAnnouncements(prev => prev.filter(ann => ann._id !== id));
        toast.success('Đã xóa thông báo thành công');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const handleUpdateEvent = async (eventId: string, eventData: FormData) => {
    try {
      setIsLoading(true);
      const updatedEvent = await eventService.updateEvent(eventId, eventData);
      setEvents(prevEvents =>
        prevEvents.map(event => (event._id === eventId ? updatedEvent : event))
      );
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating event');
      console.error('Error updating event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAnnouncement = async (id: string, data: FormData) => {
    try {
      setIsLoading(true);
      const updatedAnnouncement = await announcementService.updateAnnouncement(id, data);
      setAnnouncements(prev => 
        prev.map(announcement => 
          announcement._id === id ? updatedAnnouncement : announcement
        )
      );
      setError(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating announcement');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDropdownMenu = (item: Event | Announcement, type: 'event' | 'announcement') => {
    const isCreator = item.creator?._id === user?._id;
    const isAdmin = user?.role === 'admin';
    const canModify = isCreator || isAdmin;

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown(item._id);
          }}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiMoreHorizontal className="text-gray-600" />
        </button>

        {activeDropdown === item._id && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setActiveDropdown(null)}
            ></div>
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              {/* Show View Details for everyone */}
              <button
                onClick={() => navigate(`/events/${item._id}/submissions`)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <MdInfoOutline className="text-blue-600" />
                <span>Xem danh sách đăng ký</span>
              </button>

              {/* Edit and Delete only for creators and admins */}
              {canModify && (
                <>
                  <button
                    onClick={() => {
                      if (type === 'event') {
                        setEditingEvent(item as Event);
                      } else {
                        setEditingAnnouncement(item as Announcement);
                      }
                      setActiveDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FiEdit2 className="text-blue-600" />
                    <span>Edit {type}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
                        handleDeletePost(item._id, type);
                      }
                      setActiveDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                  >
                    <FiTrash2 className="text-red-600" />
                    <span>Delete {type}</span>
                  </button>
                </>
              )}

              {/* Admin-only actions */}
              {isAdmin && (
                <>
                  {type === 'event' && (
                    <button
                      onClick={() => {
                        // Handle duplicate action
                        setActiveDropdown(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <MdContentCopy className="text-green-600" />
                      <span>Duplicate event</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      // Handle pin/priority action
                      setActiveDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <MdPushPin className="text-orange-600" />
                    <span>{type === 'announcement' ? 'Change priority' : 'Pin to top'}</span>
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderAnnouncement = (announcement: Announcement) => (
    <div key={announcement._id} 
      className={`bg-white rounded-lg shadow-sm p-4 mb-4 ${
        announcement.priority >= 4 ? 'border-l-4 border-red-500' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">          {getSafeAvatarUrl(announcement.creator?.avatar) ? (
            <img src={getSafeAvatarUrl(announcement.creator?.avatar)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="ml-3">
            <h3 className="font-semibold">{announcement.creator?.fullName}</h3>
            <p 
              className="text-sm text-gray-500 hover:text-orange-600 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleTimeClick(announcement);
              }}
            >
              {formatTimeAgo(announcement.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {announcement.priority >= 4 && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
              Urgent
            </span>
          )}
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${
            announcement.category === 'general' ? 'bg-blue-100 text-blue-800' :
            announcement.category === 'academic' ? 'bg-green-100 text-green-800' :
            announcement.category === 'event' ? 'bg-purple-100 text-purple-800' :
            announcement.category === 'news' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {announcement.category.charAt(0).toUpperCase() + announcement.category.slice(1)}
          </span>
          {announcement && renderDropdownMenu(announcement, 'announcement')}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">{announcement.title}</h2>
      <p className="text-gray-700 mb-4 whitespace-pre-line">{announcement.content}</p>

      {announcement.images && announcement.images.length > 0 && (
        <div className="mt-4 mb-4">
          <EventImageGrid 
            images={announcement.images}
            title={announcement.title}              event={{
                title: announcement.title,
                description: announcement.content,
                organizer: {
                  fullName: announcement.creator.fullName,
                  avatar: getSafeAvatarUrl(announcement.creator.avatar),
                },
                createdAt: new Date(announcement.createdAt)
              }}
          />
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Hạn: {formatEventDate(new Date(announcement.expiresAt))}</span>
          {announcement.department && (
            <span>Khoa: {announcement.department.name}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderDescription = (description: string) => {
    const parts = formatDescriptionWithLinks(description);
    return parts.map((part, index) => {
      if (typeof part === 'string') {
        return <span key={index}>{part}</span>;
      }
      return (
        <a 
          key={index}
          href={part.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part.text}
        </a>
      );
    });
  };

  const renderEvent = (event: Event) => (
    <div
      key={event._id}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-[#EDEDED]">
        <div className="flex items-center">
          {/* <img
            src={event.organizer?.avatar?.url || '/default-avatar.png'}
            alt={event.organizer?.fullName || 'User'}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.png';
            }}
          /> */}          {getSafeAvatarUrl(event.organizer?.avatar) ? (
            <img src={getSafeAvatarUrl(event.organizer?.avatar)} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="ml-3 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {event.organizer?.fullName || 'Unknown'}
                  </h3>
                  {event.department?.name && (
                    <span className="text-xs text-gray-500">• {event.department.name}</span>
                  )}
                  {event.community?.name && (
                    <span className="text-xs text-blue-600 font-medium">
                      {event.department?.name ? ' • ' : ' • '}trong {event.community.name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 hover:text-orange-600 cursor-pointer whitespace-nowrap flex-shrink-0 ml-2">
                  {event.createdAt ? formatTimeAgo(event.createdAt) : ''}
                </span>
              </div>
              
              {/* Location info on separate line */}
              <div className="flex items-center gap-3 flex-wrap">
                {(event.eventType === 'offline' || event.eventType === 'hybrid') && 
                  event.location?.physical?.address && (
                    <div className="flex items-center space-x-1">
                      <IoLocationOutline className="text-orange-500 w-3 h-3" />
                      <span className="text-xs text-gray-500 truncate max-w-[200px]">
                        {event.location.physical.room 
                          ? `${event.location.physical.address} - ${event.location.physical.room}`
                          : event.location.physical.address}
                      </span>
                    </div>
                )}
                {(event.eventType === 'online' || event.eventType === 'hybrid') && 
                  event.location?.online?.platform && (
                    <div className="flex items-center space-x-1">
                      <IoDesktopOutline className="text-orange-500 w-3 h-3" />
                      <span className="text-xs text-gray-500 truncate">
                        {event.location.online.platform}
                      </span>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {event && renderDropdownMenu(event, 'event')}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h2 className="text-base font-semibold text-[#000000] line-clamp-2">{event.title}</h2>
        <div className="mt-2">
          <p className={`text-sm text-[#666666] whitespace-pre-line ${
            expandedDescriptions.has(event._id) ? '' : 'line-clamp-3'
          }`}>
            {renderDescription(event.description)}
          </p>
          {event.description.split('\n').length > 3 && (
            <button
              onClick={() => toggleDescription(event._id)}
              className="text-sm text-orange-600 hover:text-orange-700 mt-1 font-medium"
            >
              {expandedDescriptions.has(event._id) ? 'Ẩn bớt' : 'Xem thêm'}
            </button>
          )}
          <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <BsCalendarEvent className="text-orange-500" />
              <span>Ngày: {event.eventDays ? formatEventDaysDisplay(event.eventDays) : 'Chưa xác định'}</span>
            </div>
            <div className="flex items-center gap-2">
              <BsCalendarCheck className="text-orange-500" />
              <span>Thời gian: {event.eventDays ? formatEventTimeDisplay(event.eventDays) : 'Chưa xác định'}</span>
            </div>
          </div>
        </div>

        {event.images?.length > 0 && (
          <EventImageGrid 
            images={event.images} 
            title={event.title} 
            event={{
              title: event.title,
              description: event.description,
              organizer: {
                fullName: event.organizer.fullName,
                avatar: getSafeAvatarUrl(event.organizer.avatar),
              },
              createdAt: event.createdAt ? new Date(event.createdAt) : new Date()
            }}
          />
        )}

        <div className="mt-auto pt-4 border-t border-[#EDEDED]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {event.participants.length} người tham gia
              </span>
              {/* <span className="text-sm text-gray-600">
                Trạng thái: {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span> */}
            </div>
            <div className="flex items-center gap-2">
              <JoinEventButton 
                eventId={event._id}
                participants={event.participants || []}
                startDate={typeof event.startDate === "string" ? new Date(event.startDate) : event.startDate}
                endDate={typeof event.endDate === "string" ? new Date(event.endDate) : event.endDate}
                status={event.status}
                creatorId={event.creator?._id}
                organizerId={event.organizer?._id}
                eventDays={event.eventDays?.map(day => ({
                  date: typeof day.date === 'string' ? day.date : day.date.toISOString(),
                  sessions: day.sessions
                }))}
                eventTitle={event.title}
              />
              
              {user && event.status !== 'cancelled' && event.status !== 'completed' && (
                <CollaborateEventButton 
                  eventId={event._id}
                  status={event.status}
                  collaborators={event.collaborators?.map(collaborator => {
                    if (typeof collaborator === 'string') {
                      return collaborator;
                    }
                    return {
                      _id: collaborator._id || '',
                      user: typeof collaborator.user === 'string' ? collaborator.user : undefined,
                      status: collaborator.status
                    };
                  }) || []}
                  organizerId={event.organizer?._id}
                  creatorId={event.creator?._id}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Add loading state handling in the render
    if (isLoading) {    return (      <div className="min-h-screen bg-[#F3F2EF] flex flex-col font-sans">        <Header />        <main className="container mx-auto px-4 py-8">          <LoadingSpinner size="lg" />        </main>      </div>    );  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] flex flex-col font-sans">
      <Header />

      <main className="container mx-auto max-w-8xl grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 px-4 flex-grow">
        <aside className="hidden lg:block lg:col-span-3 sticky top-16 h-fit">
          <LeftSidebar />
        </aside>

        <section className="col-span-1 lg:col-span-6 mb-10">
          {isCachedData && (
            <div className="mb-4 flex justify-between items-center bg-white rounded-lg shadow-sm p-3">
              <span className="text-sm text-gray-500">Hiển thị dữ liệu đã lưu trong bộ nhớ cache</span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => fetchContent(true)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Làm mới nội dung
                </button>
                <button 
                  onClick={handleForceRefresh}
                  className="text-sm bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 font-medium flex items-center"
                >
                  <IoRefreshOutline className="mr-1" />
                  Làm mới tất cả
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-start space-x-2">              {getSafeAvatarUrl(user?.avatar) ? (
                <img src={getSafeAvatarUrl(user?.avatar)} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
              {/* Chỉ hiển thị cho Admin và Teacher, không hiển thị cho Student */}
              {user && (user.role === 'admin' || user.role === 'teacher') && (
                <div onClick={() => setIsModalOpen(true)} className="flex-grow cursor-pointer">
                  <div className="bg-gray-100 hover:bg-gray-200 rounded-full py-3.5 px-4 transition-colors">
                    <p className="text-[#666666]">Chia sẻ sự kiện với cộng đồng của bạn...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chỉ hiển thị cho Admin và Teacher, không hiển thị cho Student */}
            {user && (user.role === 'admin' || user.role === 'teacher') && (
              <div className="flex mt-3 items-center justify-around border-t pt-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-1"
                >
                  <MdImage className="text-[#378fe9] text-xl" />
                  <span className="text-[#666666] text-sm font-medium">Ảnh</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-1"
                >
                  <BiCalendarEvent className="text-[#c37d16] text-xl" />
                  <span className="text-[#666666] text-sm font-medium">Sự kiện</span>
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-1"
                >
                  <IoLocationOutline className="text-[#e16745] text-xl" />
                  <span className="text-[#666666] text-sm font-medium">Vị trí</span>
                </button>
              </div>
            )}
          </div>

          {events.length === 0 && announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
              <h2 className="text-lg font-semibold text-[#000000]">Welcome to HUTECH Events!</h2>
              <p className="text-sm text-[#666666] mt-2">
                Discover exciting events and connect with the student community.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map(renderAnnouncement)}
              {events.map(renderEvent)}
            </div>
          )}
        </section>

        <aside className="hidden lg:block lg:col-span-3 sticky top-16 h-fit">
          <RightSidebar />
        </aside>
      </main>

      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
        }}
      />

      <EditEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSubmit={handleUpdateEvent}
        event={editingEvent}
      />
      <EditAnnouncementModal
        isOpen={!!editingAnnouncement}
        onClose={() => setEditingAnnouncement(null)}
        onSubmit={handleUpdateAnnouncement}
        announcement={editingAnnouncement}
      />
    </div>
  );
};

export default Home;