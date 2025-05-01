import React, { useEffect, useState } from 'react';
import { MdImage, MdEdit, MdDelete, MdContentCopy, MdPushPin, MdInfoOutline } from 'react-icons/md';
import { BiCalendarEvent } from 'react-icons/bi';
import { IoLocationOutline, IoDesktopOutline } from 'react-icons/io5';
import { BsThreeDotsVertical } from 'react-icons/bs';
import Header from '../components/Header';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import eventService from '../services/eventService';
import announcementService from '../services/announcementService';
import CreateEventModal from '../components/modals/CreateEventModal';
import EventImageGrid from '../components/EventImageGrid';
import EditEventModal from '../components/modals/EditEventModal';
import EditAnnouncementModal from '../components/modals/EditAnnouncementModal';
import { Event } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useEvents } from '../context/EventContext';
import JoinEventButton from '../components/JoinEventButton';

// Interface for Event
interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  eventType: 'offline' | 'online' | 'hybrid';
  location: {
    physical?: {
      address: string;
      room: string;
    };
    online?: {
      platform: string;
      meetingLink: string;
    };
  };
  images: Array<{
    public_id: string;
    url: string;
  }>;
  organizer: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
  participants: string[];
  collaborators: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  creator: string;
  createdAt: Date;
}

// Interface for Announcement
interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  creator: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: {
      public_id: string;
      url: string;
    };
  };
  department: {
    _id: string;
    name: string;
  } | null;
  expiresAt: string;
  status: 'active' | 'expired' | 'archived';
  images: Array<{
    public_id: string;
    url: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

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

  const toggleDropdown = (id: string) => {
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  const sortEvents = (events: Event[]) => {
    const now = new Date();
    return events.sort((a, b) => {
      const startDateA = new Date(a.startDate);
      const startDateB = new Date(b.startDate);
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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
    if ('startDate' in post) {
      navigate(`/events/${post._id}`);
    } else {
      navigate(`/announcements/${post._id}`);
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
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
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        // Ensure participants are mapped correctly
        const formattedEvents = fetchedEvents.map(event => ({
          ...event,
          participants: event.participants.map((p: any) => 
            typeof p === 'string' ? p : p._id.toString()
          )
        }));

        const sortedEvents = sortEvents(formattedEvents);
        
        setAnnouncements(activeAnnouncements);
        setEvents(sortedEvents);
        setError(null);
      } catch (error: any) {
        setError(error.response?.data?.message || 'Error fetching content');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
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
          <BsThreeDotsVertical className="text-gray-600" />
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
                onClick={() => {
                  // Handle view details action
                  setActiveDropdown(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <MdInfoOutline className="text-blue-600" />
                <span>View details</span>
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
                    <MdEdit className="text-blue-600" />
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
                    <MdDelete className="text-red-600" />
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
        <div className="flex items-center">
          <img
            src={announcement.creator?.avatar?.url || '/default-avatar.png'}
            alt={announcement.creator?.fullName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.png';
            }}
          />
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
            title={announcement.title}
            event={{
              title: announcement.title,
              description: announcement.content,
              organizer: {
                fullName: announcement.creator.fullName,
                avatar: announcement.creator.avatar,
              },
              createdAt: new Date(announcement.createdAt),
              status: announcement.status,
              category: announcement.category,
              priority: announcement.priority
            }}
          />
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Expires: {formatEventDate(new Date(announcement.expiresAt))}</span>
          {announcement.department && (
            <span>Department: {announcement.department.name}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderEvent = (event: Event) => (
    <div
      key={event._id}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-[#EDEDED]">
        <div className="flex items-center">
          <img
            src={event.organizer?.avatar?.url || '/default-avatar.png'}
            alt={event.organizer?.fullName || 'User'}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.png';
            }}
          />
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-[#000000]">
              {event.organizer?.fullName || 'Anonymous'}
            </h3>
            <div className="flex items-center gap-2">
              <span 
                className="text-xs text-gray-500 hover:text-orange-600 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTimeClick(event);
                }}
              >
                {formatTimeAgo(event.createdAt)}
              </span>
              <div className="flex items-center gap-3">
                {(event.eventType === 'offline' || event.eventType === 'hybrid') && 
                  event.location?.physical?.address && (
                    <div className="flex items-center space-x-1">
                      <IoLocationOutline className="text-orange-500 w-3 h-3" />
                      <span className="text-xs text-gray-500 truncate max-w-[150px]">
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
                        {event.location.online.platform} Meeting
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
        <p className="text-sm text-[#666666] mt-2 line-clamp-3">{event.description}</p>

        {event.images?.length > 0 && (
          <EventImageGrid 
            images={event.images} 
            title={event.title} 
            event={{
              title: event.title,
              description: event.description,
              organizer: {
                fullName: event.organizer.fullName,
                avatar: event.organizer.avatar,
              },
              createdAt: event.createdAt,
              eventType: event.eventType,
              location: event.location,
              participants: event.participants,
              status: event.status
            }}
          />
        )}

        <div className="mt-auto pt-4 border-t border-[#EDEDED]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {event.participants.length} người tham gia
              </span>
              <span className="text-sm text-gray-600">
                Trạng thái: {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
            <JoinEventButton
              eventId={event._id}
              participants={event.participants}
              startDate={event.startDate}
              endDate={event.endDate}
              status={event.status}
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
    </div>
  );

  // Add loading state handling in the render
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex flex-col font-sans">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Loading events...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] flex flex-col font-sans">
      <Header />

      <main className="container mx-auto max-w-8xl grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4 px-4 flex-grow">
        <aside className="hidden lg:block lg:col-span-3 sticky top-16 h-fit">
          <LeftSidebar />
        </aside>

        <section className="col-span-1 lg:col-span-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-start space-x-2">
              <img
                src={user?.avatar?.url || '/default-avatar.png'}
                alt={user?.fullName || 'User avatar'}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
              <div onClick={() => setIsModalOpen(true)} className="flex-grow cursor-pointer">
                <div className="bg-gray-100 hover:bg-gray-200 rounded-full py-3.5 px-4 transition-colors">
                  <p className="text-[#666666]">Share an event with your community...</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-2 border-t">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-1"
              >
                <MdImage className="text-[#378fe9] text-xl" />
                <span className="text-[#666666] text-sm font-medium">Photo</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-1"
              >
                <BiCalendarEvent className="text-[#c37d16] text-xl" />
                <span className="text-[#666666] text-sm font-medium">Event</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-1"
              >
                <IoLocationOutline className="text-[#e16745] text-xl" />
                <span className="text-[#666666] text-sm font-medium">Location</span>
              </button>
            </div>
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
        onSubmit={handlePostEvent}
        isLoading={isLoading}
        error={error}
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