import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import departmentService from '../services/departmentService';
import JoinEventButton from '../components/JoinEventButton';
import EventImageGrid from '../components/EventImageGrid';
import { formatTimeAgo } from '@/utils/timeUtils';
import { formatDescriptionWithLinks } from '@/utils/linkUtils';
import { 
  IoBriefcaseOutline, IoCalendarOutline, IoPeopleOutline, 
  IoNewspaperOutline, IoSchoolOutline, IoStatsChartOutline,
  IoLocationOutline, IoTimeOutline, IoDesktopOutline
} from 'react-icons/io5';
import { BsCalendarEvent, BsCalendarCheck } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

interface DepartmentData {
  _id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  head?: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: {
      public_id: string;
      url: string;
    };
    phone?: string;
    role: string;
    department: any;
  };
  createdAt: string;
  updatedAt: string;
}

const DepartmentDetail = () => {
  const { id } = useParams();
  const { departmentEvents, fetchDepartmentEvents, loading: eventsLoading } = useEvents();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [isFollowing, setIsFollowing] = useState(false);
  const [department, setDepartment] = useState<DepartmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (id) {
          setLoading(true);
          await Promise.all([
            departmentService.getDepartmentById(id).then(setDepartment),
            fetchDepartmentEvents(id)
          ]);
        }
      } catch (err) {
        setError('Không thể tải thông tin khoa');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, fetchDepartmentEvents]);

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

  const handleTimeClick = (event: any) => {
    navigate(`/events/${event._id}`);
  };

  const renderEvent = (event: any) => (
    <div
      key={event._id}
      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-[#EDEDED]">
        <div className="flex items-center">
          <img
            src={event.organizer?.avatar?.url || "/default-avatar.png"}
            alt={event.organizer?.fullName || "Event creator"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.png';
            }}
          />
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-[#000000]">
              {event.organizer?.fullName || 'Anonymous'}
              {event.department && (
                <>
                  <span className="text-sm font-normal text-gray-600 ml-1">tại</span>
                  <span className="text-sm font-semibold text-[#000000] ml-1">
                    {event.department.name}
                  </span>
                </>
              )}
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
                {(event.mode === 'offline' || event.mode === 'hybrid') && 
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
                {(event.mode === 'online' || event.mode === 'hybrid') && 
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
              <span>Bắt đầu: {new Date(event.startDate).toLocaleString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <BsCalendarCheck className="text-orange-500" />
              <span>Kết thúc: {new Date(event.endDate).toLocaleString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {event.images && (
          <EventImageGrid 
            images={event.images}
            title={event.title}
            event={{
              title: event.title,
              description: event.description,
              organizer: {
                fullName: event.organizer?.fullName || '',
                avatar: event.organizer?.avatar,
              },
              createdAt: new Date(event.createdAt),
              startDate: event.startDate,
              endDate: event.endDate,
              eventType: event.mode,
              location: event.location,
              participants: event.participants,
              status: event.status
            }}
          />
        )}

        <div className="mt-auto pt-4 border-t border-[#EDEDED]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {event.participants?.length || 0} người tham gia
            </span>
            <div className="flex gap-2">
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
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !department) {
    return <div>Error: {error || 'Không tìm thấy thông tin khoa'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="relative">
        <div className="h-64 relative bg-orange-600 text-white py-16 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }} />
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="relative -mt-24 mb-6 flex flex-col md:flex-row items-start md:items-end gap-6 z-10">
            <div className="w-32 h-32 rounded-xl bg-white shadow-lg p-2">
              <div className="w-full h-full rounded-lg bg-orange-600 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">{department?.code}</span>
              </div>
            </div>

            <div className="flex-grow">
              <h1 className="text-3xl font-bold text-white mb-2">
                {department?.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/90">
                <span className="flex items-center gap-1">
                  <IoPeopleOutline />
                  {department?.head ? 'Có trưởng khoa' : 'Chưa có trưởng khoa'}
                </span>
                <span className="flex items-center gap-1">
                  <IoCalendarOutline />
                  {new Date(department?.createdAt || '').toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                {!department?.isActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Ngừng hoạt động
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <IoPeopleOutline className="text-xl" />
                {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex gap-8">
              {[
                { id: 'events', label: 'Sự kiện', icon: IoCalendarOutline },
                { id: 'announcements', label: 'Thông báo', icon: IoNewspaperOutline },
                { id: 'about', label: 'Giới thiệu', icon: IoBriefcaseOutline },
                { id: 'members', label: 'Thành viên', icon: IoPeopleOutline },
                { id: 'stats', label: 'Thống kê', icon: IoStatsChartOutline }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="text-xl" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <IoBriefcaseOutline className="text-xl text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Giới thiệu</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {department?.description}
                    </p>
                  </div>
                </div>

                {department?.head && (
                  <div className="flex items-start gap-3">
                    <IoPeopleOutline className="text-xl text-gray-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Trưởng khoa</h4>
                      <div className="flex items-center gap-3 mt-2">
                        {department.head.avatar ? (
                          <img 
                            src={department.head.avatar.url}
                            alt={department.head.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-xl font-medium text-orange-600">
                              {department.head.fullName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{department.head.fullName}</p>
                          <p className="text-sm text-gray-500">{department.head.email}</p>
                          {department.head.phone && (
                            <p className="text-sm text-gray-500">{department.head.phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <IoTimeOutline className="text-xl text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Cập nhật lần cuối</h4>
                    <p className="text-gray-600 text-sm mt-1">
                      {new Date(department?.updatedAt || '').toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {department?.head && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Ban chủ nhiệm khoa</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {department.head.avatar ? (
                      <img 
                        src={department.head.avatar.url}
                        alt={department.head.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-xl font-medium text-orange-600">
                          {department.head.fullName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium">{department.head.fullName}</h4>
                      <p className="text-sm text-gray-600">Trưởng khoa</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Ngành đào tạo</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Công nghệ thông tin</span>
                  <span className="text-sm text-gray-500">180 SV</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kỹ thuật phần mềm</span>
                  <span className="text-sm text-gray-500">150 SV</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">An toàn thông tin</span>
                  <span className="text-sm text-gray-500">120 SV</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <img 
                  src="https://placekitten.com/50/50" 
                  alt="User"
                  className="w-10 h-10 rounded-full"
                />
                <button 
                  className="flex-grow text-left px-4 py-2 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200"
                >
                  Đăng thông báo cho Khoa...
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {Array.isArray(departmentEvents) && departmentEvents.map(renderEvent)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentDetail;
