import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import Header from '../components/Header';
import eventService from '../services/eventService';
import announcementService from '../services/announcementService';
import { Event, Announcement, isEvent } from '../types';
import { IoPeopleOutline, IoLocationOutline, IoDesktopOutline } from 'react-icons/io5';
import { BsThreeDotsVertical, BsCalendarEvent, BsCalendarCheck } from 'react-icons/bs';
import { MdEdit, MdDelete, MdContentCopy, MdPushPin, MdInfoOutline } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import EventImageGrid from '../components/EventImageGrid';
import { toast } from 'react-toastify';
import JoinEventButton from '../components/JoinEventButton';
import CollaborateEventButton from '../components/CollaborateEventButton';
import { useEvents } from '../context/EventContext';
import { formatDescriptionWithLinks } from '@/utils/linkUtils';
import Certificate from '../components/Certificate';
import { UserIcon } from '@heroicons/react/outline';
import CollaboratorsList from '../components/CollaboratorsList';

const PostDetails: React.FC = () => {
  const { id } = useParams();
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { updateEventParticipants, updateEventCollaborators } = useEvents();
  const [post, setPost] = useState<Event | Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentParticipants, setCurrentParticipants] = useState<string[]>([]);
  const [currentCollaborators, setCurrentCollaborators] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const isEventPage = location.includes('/events/');

  const formatTimeAgo = (date: string | Date) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: vi
    });
  };

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        if (isEventPage) {
          const data = await eventService.getEventById(id);
          if (data?.data) {
            setPost(data.data);
          } else {
            setError('Event not found');
          }
        } else {
          try {
            const data = await announcementService.getAnnouncementById(id);
            console.log('Announcement data received:', data);
            if (data) {
              setPost(data);
            } else {
              setError('Announcement not found');
            }
          } catch (error) {
            console.error('Error fetching announcement:', error);
            setError('Failed to load announcement');
          }
        }
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Error fetching post details');
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [id, isEventPage]);

  useEffect(() => {
    if (post && isEvent(post) && post.participants && post.collaborators) {
      setCurrentParticipants(post.participants);
      setCurrentCollaborators(post.collaborators);
    }
  }, [post]);

  const handleParticipantUpdate = (isJoining: boolean) => {
    if (!user?._id || !id) return;
    
    // Cập nhật cả 2 state đồng thời
    setCurrentParticipants(prev => {
      if (isJoining && user._id) {
        return [...prev, user._id];
      } else {
        return prev.filter(participantId => participantId !== user._id);
      }
    });

    // Gọi update trong context để cập nhật danh sách người tham gia
    if (user._id) {
      updateEventParticipants(id, user._id, isJoining);
    }
  };

  const handleCollaboratorUpdate = (isJoining: boolean) => {
    if (!user?._id || !id) return;
    
    setCurrentCollaborators(prev => {
      if (isJoining && user._id) {
        return [...prev, user._id];
      } else {
        return prev.filter(collaboratorId => collaboratorId !== user._id);
      }
    });

    if (user._id) {
      updateEventCollaborators(id, user._id, isJoining);
    }
  };

  const renderDropdownMenu = (item: Event | Announcement, type: 'event' | 'announcement') => {
    const isCreator = item.creator?._id === user?._id;
    const isAdmin = user?.role === 'admin';
    const canModify = isCreator || isAdmin;

    const handleDelete = async () => {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa ${type === 'event' ? 'sự kiện' : 'thông báo'} này?`)) {
        return;
      }

      try {
        if (type === 'event') {
          await eventService.deleteEvent(item._id);
          toast.success('Đã xóa sự kiện thành công');
        } else {
          await announcementService.deleteAnnouncement(item._id);
          toast.success('Đã xóa thông báo thành công');
        }
        navigate('/');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : `Lỗi khi xóa ${type === 'event' ? 'sự kiện' : 'thông báo'}`;
        
        // Check for axios error structure
        if (typeof error === 'object' && error !== null && 'response' in error) {
          // @ts-expect-error - Handle axios error structure
          const responseMessage = error.response?.data?.message;
          toast.error(responseMessage || errorMessage);
        } else {
          toast.error(errorMessage);
        }
      }
      setActiveDropdown(null);
    };

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveDropdown(activeDropdown === item._id ? null : item._id);
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

              {canModify && (
                <>
                  <button
                    onClick={() => {
                      // Handle edit
                      setActiveDropdown(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <MdEdit className="text-blue-600" />
                    <span>Edit {type}</span>
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                  >
                    <MdDelete className="text-red-600" />
                    <span>Delete {type}</span>
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  {type === 'event' && (
                    <button
                      onClick={() => {
                        // Handle duplicate
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
                      // Handle pin/priority
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

  const renderDescription = (description: string) => {
    const parts = formatDescriptionWithLinks(description);
    const shouldShowExpandButton = description.split('\n').length > 3;

    return (
      <div className="prose max-w-none">
        <div className={`whitespace-pre-line ${!isExpanded ? 'line-clamp-3' : ''}`}>
          {parts.map((part, index) => {
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
          })}
        </div>
        {shouldShowExpandButton && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-orange-600 hover:text-orange-700 mt-2 font-medium"
          >
            {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
          </button>
        )}
      </div>
    );
  };

  const renderEventDetails = (post: Event) => (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#EDEDED]">
          <div className="flex items-center">
            {post.organizer?.avatar && typeof post.organizer.avatar === 'object' && 'url' in post.organizer.avatar ? (
              <img src={post.organizer.avatar.url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-[#000000]">
                {post.organizer?.fullName || 'Anonymous'}
                {post.department && (
                  <>
                    <span className="text-sm font-normal text-gray-600 ml-1">tại</span>
                    <span className="text-sm font-semibold text-[#000000] ml-1">
                      {post.department.name}
                    </span>
                  </>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 hover:text-orange-600 cursor-pointer">
                  {post.createdAt ? formatTimeAgo(post.createdAt) : ''}
                </span>
                <div className="flex items-center gap-3">
                  {(post.eventType === 'offline' || post.eventType === 'hybrid') && 
                    post.location?.physical?.address && (
                      <div className="flex items-center space-x-1">
                        <IoLocationOutline className="text-orange-500 w-3 h-3" />
                        <span className="text-xs text-gray-500 truncate max-w-[150px]">
                          {post.location.physical.room 
                            ? `${post.location.physical.address} - ${post.location.physical.room}`
                            : post.location.physical.address}
                        </span>
                      </div>
                  )}
                  {(post.eventType === 'online' || post.eventType === 'hybrid') && 
                    post.location?.online?.platform && (
                      <div className="flex items-center space-x-1">
                        <IoDesktopOutline className="text-orange-500 w-3 h-3" />
                        <span className="text-xs text-gray-500 truncate">
                          {post.location.online.platform} Meeting
                        </span>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {(
            renderDropdownMenu(post, 'event')
          )}
        </div>

        <div className="p-4 flex flex-col">
          <h2 className="text-base font-semibold text-[#000000] mb-4">{post.title}</h2>
          
          <div className="space-y-4">
            <div className="mb-6">
              {renderDescription(post.description)}
            </div>

            <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <BsCalendarEvent className="text-orange-500" />
                <span>Bắt đầu: {new Date(post.startDate).toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <BsCalendarCheck className="text-orange-500" />
                <span>Kết thúc: {new Date(post.endDate).toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {post.images?.length > 0 && (
            <div className="">
              <EventImageGrid 
                images={post.images} 
                title={post.title} 
                event={{
                  title: post.title,
                  description: post.description,
                  organizer: {
                    fullName: post.organizer.fullName,
                    avatar: typeof post.organizer.avatar === 'object' && 'url' in post.organizer.avatar 
                            ? post.organizer.avatar.url : undefined
                  },
                  createdAt: typeof post.createdAt === 'string' ? new Date(post.createdAt) : (post.createdAt || new Date())
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <IoPeopleOutline className="text-orange-500" />
                {currentParticipants.length} người tham gia
              </span>
            </div>
            <div className="flex items-center gap-2">
              <JoinEventButton
                eventId={post._id}
                participants={currentParticipants}
                startDate={typeof post.startDate === 'string' ? new Date(post.startDate) : post.startDate}
                endDate={typeof post.endDate === 'string' ? new Date(post.endDate) : post.endDate}
                status={post.status}
                onJoinSuccess={() => {
                  handleParticipantUpdate(true);
                }}
                onLeaveSuccess={() => {
                  handleParticipantUpdate(false);
                }}
              />
              
              {/* Collaborator Button */}
              {user && post && post.status !== 'cancelled' && post.status !== 'completed' && 
                isEvent(post) && (
                  <CollaborateEventButton 
                    eventId={post._id}
                    status={post.status}
                    collaborators={currentCollaborators}
                    startDate={typeof post.startDate === 'string' ? new Date(post.startDate) : post.startDate}
                    endDate={typeof post.endDate === 'string' ? new Date(post.endDate) : post.endDate}
                    onJoinSuccess={() => handleCollaboratorUpdate(true)}
                    onLeaveSuccess={() => handleCollaboratorUpdate(false)}
                  />
                )
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnnouncementDetails = (announcement: Announcement) => (
    <div className="lg:col-span-2">
      <div className={`bg-white rounded-lg shadow-sm p-4 
        ${announcement.priority >= 4 ? 'border-l-4 border-red-500' : ''}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {announcement.creator?.avatar && typeof announcement.creator.avatar === 'object' && 'url' in announcement.creator.avatar ? (
              <img src={announcement.creator.avatar.url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="ml-3">
              <h3 className="font-semibold">{announcement.creator?.fullName}</h3>
              <p className="text-sm text-gray-500">
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
            {renderDropdownMenu(announcement, 'announcement')}
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
                  avatar: typeof announcement.creator.avatar === 'object' && 'url' in announcement.creator.avatar 
                         ? announcement.creator.avatar.url : undefined
                },
                createdAt: new Date(announcement.createdAt)
              }}
            />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
            {announcement.department && (
              <span>Department: {announcement.department.name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-[calc(100vh-200px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : error || !post ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Post not found</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {isEventPage ? renderEventDetails(post as Event) : renderAnnouncementDetails(post as Announcement)}
            <div className="lg:col-span-1">
              {isEventPage ? (
                <EventSidebar 
                  event={post as Event}
                  currentParticipants={currentParticipants}
                  currentCollaborators={currentCollaborators}
                  handleParticipantUpdate={handleParticipantUpdate}
                  handleCollaboratorUpdate={handleCollaboratorUpdate}
                />
              ) : (
                <AnnouncementSidebar announcement={post as Announcement} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

interface EventSidebarProps {
  event: Event;
  currentParticipants: string[];
  currentCollaborators: string[];
  handleParticipantUpdate: (isJoining: boolean) => void;
  handleCollaboratorUpdate: (isJoining: boolean) => void;
}

const EventSidebar: React.FC<EventSidebarProps> = ({ event, currentParticipants, currentCollaborators, handleParticipantUpdate, handleCollaboratorUpdate }) => {
  const { user } = useAuth();
  const { currentParticipantList, fetchParticipants, currentCollaboratorList, fetchCollaborators } = useEvents();
  const [, navigate] = useLocation();
  const [certificateTab, setCertificateTab] = useState<'participant' | 'collaborator'>('participant');

  // Fetch participants when component mounts or event changes
  useEffect(() => {
    if (event._id) {
      fetchParticipants(event._id);
      fetchCollaborators(event._id);
    }
  }, [event._id, fetchParticipants, fetchCollaborators]);

  // Check if the event has ended to show certificate section
  const isEventEnded = new Date(event.endDate) < new Date();
  const isUserParticipant = user && user._id ? currentParticipants.includes(user._id) : false;
  const isUserCollaborator = user && user._id ? currentCollaborators.includes(user._id) : false;
  
  // Check for admin privileges
  const isAdmin = user?.role === 'admin';
  const isEventCreator = event.creator?._id === user?._id;
  const isEventOrganizer = event.organizer?._id === user?._id;
  
  // Set initial tab based on user roles
  useEffect(() => {
    if (isUserCollaborator && !isUserParticipant) {
      setCertificateTab('collaborator');
    } else if (isUserParticipant) {
      setCertificateTab('participant');
    }
  }, [isUserParticipant, isUserCollaborator]);
    
  const handleCertificateTabChange = (tab: 'participant' | 'collaborator') => {
    setCertificateTab(tab);
  };

  // Check if user has permission to access check-in page
  const canAccessCheckin = 
    isAdmin || // Admin system
    isEventCreator || // Event creator
    isEventOrganizer || // Event organizer
    isUserCollaborator; // Event collaborator

  return (
    <div className="sticky top-20 space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Tham gia sự kiện</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
              event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
              event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'}`}
          >
            {event.status === 'upcoming' ? 'Sắp diễn ra' :
             event.status === 'ongoing' ? 'Đang diễn ra' :
             event.status === 'completed' ? 'Đã kết thúc' : 'Đã hủy'}
          </span>
        </div>

        <div className="flex flex-col space-y-3">
          <div className="flex gap-3">
            <JoinEventButton
              eventId={event._id}
              participants={currentParticipants}
              startDate={typeof event.startDate === 'string' ? new Date(event.startDate) : event.startDate}
              endDate={typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate}
              status={event.status}
              onJoinSuccess={() => handleParticipantUpdate(true)}
              onLeaveSuccess={() => handleParticipantUpdate(false)}
            />
            
            {/* Collaborator Button */}
            {user && event.status !== 'cancelled' && event.status !== 'completed' && (
              <CollaborateEventButton 
                eventId={event._id}
                status={event.status}
                collaborators={currentCollaborators}
                onJoinSuccess={() => handleCollaboratorUpdate(true)}
                onLeaveSuccess={() => handleCollaboratorUpdate(false)}
              />
            )}
          </div>

          {/* Check-in Button for authorized users */}
          {canAccessCheckin && (
            <button
              onClick={() => navigate(`/events/${event._id}/checkin`)}
              className="flex items-center justify-center gap-2 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <i className="fas fa-clipboard-check"></i>
              Điểm danh sự kiện
            </button>
          )}
        </div>
      </div>

      {/* Certificate Section - Show for ended events if user participated or collaborated */}
      {isEventEnded && (isUserParticipant || isUserCollaborator || isAdmin || isEventCreator || isEventOrganizer) && user && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Chứng nhận</h3>
          <div className="mb-4">
            <p className="text-gray-600">
              Nhận chứng nhận cho sự kiện này.
            </p>
          </div>
          
          {/* Tabs for different certificate types */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex">
              {/* Always show Participant tab for admins and managers */}
              <button
                onClick={() => handleCertificateTabChange('participant')}
                className={`w-1/2 py-2 px-1 text-center border-b-2 ${
                  certificateTab === 'participant' 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } font-medium text-sm`}
              >
                <i className="fas fa-users mr-2"></i>
                Người tham gia
              </button>
              
              {/* Always show Collaborator tab for admins and managers */}
              <button
                onClick={() => handleCertificateTabChange('collaborator')}
                className={`w-1/2 py-2 px-1 text-center border-b-2 ${
                  certificateTab === 'collaborator' 
                    ? 'border-green-500 text-green-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } font-medium text-sm`}
              >
                <i className="fas fa-user-tie mr-2"></i>
                Cộng tác viên
              </button>
            </nav>
          </div>
          
          <div className={certificateTab !== 'participant' ? 'hidden' : ''}>
            {user && user._id && (
              <Certificate 
                eventId={event._id} 
                userId={user._id}
                certificateType="participant"
              />
            )}
          </div>
          
          <div className={certificateTab !== 'collaborator' ? 'hidden' : ''}>
            {user && user._id && (
              <Certificate 
                eventId={event._id} 
                userId={user._id}
                certificateType="collaborator"
              />
            )}
          </div>
        </div>
      )}

      {/* Participants Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Người tham gia</h3>
        <p className="text-gray-600 mb-4">
          {currentParticipants?.length || 0} người đã tham gia
        </p>

        <div className="space-y-4">
          {currentParticipantList.length > 0 ? (
            currentParticipantList.map((participant) => (
              <div key={participant._id} className="flex items-center gap-3">
                {participant.avatar?.url ? (
                  <img src={participant.avatar.url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {participant.fullName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.registrationStatus === 'approved' ? 'Đã tham gia' : 'Đã hủy'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">
              {/* Chưa có người tham gia */}
            </p>
          )}
        </div>
      </div>
      
      {/* Collaborators Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Cộng tác viên</h3>
        <p className="text-gray-600 mb-4">
          {currentCollaboratorList.length || 0} người đã tham gia
        </p>

        {/* Usar el nuevo componente de lista de colaboradores */}
        {event._id && (
          <CollaboratorsList eventId={event._id} />
        )}
      </div>
    </div>
  );
};

const AnnouncementSidebar = ({ announcement }: { announcement: Announcement }) => {
  return (
    <div className="sticky top-20 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Details</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${announcement.priority >= 4 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
          >
            {announcement.priority >= 4 ? 'Urgent' : 'Regular'}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Category</h4>
            <p className="text-gray-600">{announcement.category}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Department</h4>
            <p className="text-gray-600">{announcement.department?.name || 'All Departments'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700">Expires</h4>
            <p className="text-gray-600">
              {new Date(announcement.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetails;