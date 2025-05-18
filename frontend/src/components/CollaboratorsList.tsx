import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventContext';
import { UserIcon } from '@heroicons/react/outline';
import { FaTrash } from 'react-icons/fa';
import { RiTimeLine } from 'react-icons/ri';
import eventService from '../services/eventService';
import notificationService from '../services/notificationService';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CollaboratorListProps {
  eventId: string;
  onUpdate?: () => void;
}

// Interface for collaborator with status
interface Collaborator {
  user: {
    _id: string;
    fullName: string;
    avatar?: {
      url: string;
      public_id: string;
    };
    email?: string;
    role?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: {
    _id: string;
    fullName: string;
  };
  rejectionReason?: string;
}

interface ErrorWithMessage {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

// Định nghĩa interface cho event details
interface EventDetails {
  _id: string;
  title: string;
  creator?: {
    _id: string;
    fullName?: string;
  };
  organizer?: {
    _id: string;
    fullName?: string;
  };
  // Thêm các trường khác nếu cần
}

const CollaboratorsList: React.FC<CollaboratorListProps> = ({ eventId, onUpdate }) => {
  const { user } = useAuth();
  const { currentCollaboratorList, fetchCollaborators, currentEvent } = useEvents();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [loadingEventDetails, setLoadingEventDetails] = useState(true);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  
  // Fetch event details to get correct creator and organizer info
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoadingEventDetails(true);
        const response = await eventService.getEventById(eventId);
        if (response.success && response.data) {
          setEventDetails(response.data);
          console.log("Event details loaded:", response.data);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoadingEventDetails(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);
  
  // Check for admin privileges or creator/organizer status
  const isAdmin = user?.role === 'admin';
  
  // Use eventDetails for more accurate creator/organizer check
  const isCreator = user?._id && eventDetails?.creator?._id === user._id;
  const isOrganizer = user?._id && eventDetails?.organizer?._id === user._id;
  
  // Fallback to currentEvent if eventDetails isn't loaded yet
  const isCreatorFallback = !eventDetails && currentEvent && user?._id === currentEvent.creator?._id;
  const isOrganizerFallback = !eventDetails && currentEvent && user?._id === currentEvent.organizer?._id;
  
  // Only admins, creators, and organizers have admin access
  const hasAdminAccess = isAdmin || isCreator || isOrganizer || isCreatorFallback || isOrganizerFallback;
  
  // Auto-show permission guide on first load for admin users
  useEffect(() => {
    // Nếu người dùng là creator hoặc organizer và thông tin sự kiện đã được tải
    if ((isCreator || isOrganizer) && !loadingEventDetails) {
      setShowPermissionGuide(true);
      
      // Tự động ẩn sau 5 giây
      const timer = setTimeout(() => {
        setShowPermissionGuide(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isCreator, isOrganizer, loadingEventDetails]);
  
  // Debug log permissions info
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Collaborator Permissions Debug:', {
        userId: user?._id,
        eventCreatorId: eventDetails?.creator?._id,
        eventOrganizerId: eventDetails?.organizer?._id,
        isAdmin,
        isCreator,
        isOrganizer,
        isCreatorFallback,
        isOrganizerFallback,
        hasAdminAccess
      });
    }
  }, [user, eventDetails, currentEvent, isAdmin, isCreator, isOrganizer, isCreatorFallback, isOrganizerFallback, hasAdminAccess]);
  
  // Convert the list to collaborators with status, ensuring safety
  let collaborators: Collaborator[] = [];
  
  // Safely convert currentCollaboratorList to Collaborator array
  if (Array.isArray(currentCollaboratorList)) {
    collaborators = currentCollaboratorList
      .filter(item => item && typeof item === 'object')
      .map(item => {
        // Safely access properties
        const userProperty = (item as { user?: unknown }).user;
        
        // Ensure proper structure for each collaborator
        if (!userProperty || (typeof userProperty !== 'object' && typeof userProperty !== 'string')) {
          console.warn('Invalid collaborator format:', item);
          return null;
        }
        
        // Handle string user ID
        if (typeof userProperty === 'string') {
          return {
            user: { _id: userProperty, fullName: 'Unknown User' },
            status: (item as { status?: string }).status || 'pending',
            requestedAt: (item as { requestedAt?: string }).requestedAt || new Date().toISOString(),
            approvedAt: (item as { approvedAt?: string }).approvedAt,
            approvedBy: (item as { approvedBy?: { _id: string; fullName?: string } }).approvedBy,
            rejectionReason: (item as { rejectionReason?: string }).rejectionReason
          } as Collaborator;
        }
        
        // Handle object user
        return {
          user: userProperty as Collaborator['user'],
          status: (item as { status?: string }).status || 'pending',
          requestedAt: (item as { requestedAt?: string }).requestedAt || new Date().toISOString(),
          approvedAt: (item as { approvedAt?: string }).approvedAt,
          approvedBy: (item as { approvedBy?: { _id: string; fullName?: string } }).approvedBy,
          rejectionReason: (item as { rejectionReason?: string }).rejectionReason
        } as Collaborator;
      })
      .filter(Boolean) as Collaborator[]; // Remove null entries
  }
  
  const handleApprove = async (userId: string, userName: string) => {
    if (!eventId || !userId) return;
    
    try {
      setLoading(prev => ({ ...prev, [userId]: true }));
      
      await eventService.approveCollaborator(eventId, userId);
      toast.success(`Đã phê duyệt ${userName} làm cộng tác viên thành công!`);
      
      // Send notification
      if (currentEvent) {
        try {
          await notificationService.createMassNotification({
            recipients: [userId],
            type: 'event_collaborator_approved',
            title: 'Yêu cầu làm CTV đã được chấp nhận',
            message: `Yêu cầu làm cộng tác viên của bạn cho sự kiện "${currentEvent.title}" đã được chấp nhận`,
            relatedModel: 'Event',
            relatedId: eventId,
            link: `/events/${eventId}`
          });
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }
      
      // Refresh collaborators list
      await fetchCollaborators(eventId);
      if (onUpdate) onUpdate();
    } catch (error) {
      const err = error as ErrorWithMessage;
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi phê duyệt');
    } finally {
      setLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const openRejectModal = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setRejectionReason('');
    setShowRejectModal(true);
  };
  
  const handleReject = async () => {
    if (!eventId || !selectedUserId) return;
    
    try {
      setLoading(prev => ({ ...prev, [selectedUserId]: true }));
      
      await eventService.rejectCollaborator(eventId, selectedUserId, rejectionReason);
      toast.success('Đã từ chối yêu cầu làm cộng tác viên!');
      
      // Send notification
      if (currentEvent) {
        try {
          await notificationService.createMassNotification({
            recipients: [selectedUserId],
            type: 'event_collaborator_rejected',
            title: 'Yêu cầu làm CTV đã bị từ chối',
            message: `Yêu cầu làm cộng tác viên của bạn cho sự kiện "${currentEvent.title}" đã bị từ chối${rejectionReason ? ': ' + rejectionReason : ''}`,
            relatedModel: 'Event',
            relatedId: eventId
          });
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }
      
      // Refresh collaborators list
      await fetchCollaborators(eventId);
      if (onUpdate) onUpdate();
      
      setShowRejectModal(false);
    } catch (error) {
      const err = error as ErrorWithMessage;
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi từ chối');
    } finally {
      setLoading(prev => ({ ...prev, [selectedUserId as string]: false }));
    }
  };

  const openDeleteModal = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowDeleteModal(true);
  };
  
  const handleDelete = async () => {
    if (!eventId || !selectedUserId) return;
    
    try {
      setLoading(prev => ({ ...prev, [selectedUserId]: true }));
      
      // Use the API to remove the collaborator
      await eventService.leaveEventAsCollaborator(eventId, selectedUserId);
      toast.success(`Đã xóa ${selectedUserName} khỏi danh sách cộng tác viên!`);
      
      // Send notification
      if (currentEvent) {
        try {
          await notificationService.createMassNotification({
            recipients: [selectedUserId],
            type: 'event_collaborator_removed',
            title: 'Bạn đã bị xóa khỏi danh sách CTV',
            message: `Bạn đã bị xóa khỏi danh sách cộng tác viên của sự kiện "${currentEvent.title}"`,
            relatedModel: 'Event',
            relatedId: eventId
          });
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }
      
      // Refresh collaborators list
      await fetchCollaborators(eventId);
      if (onUpdate) onUpdate();
      
      setShowDeleteModal(false);
    } catch (error) {
      const err = error as ErrorWithMessage;
      toast.error(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xóa cộng tác viên');
    } finally {
      setLoading(prev => ({ ...prev, [selectedUserId as string]: false }));
    }
  };
  
  // Group collaborators by status
  const pendingCollaborators = collaborators
    .filter(c => c && typeof c === 'object' && c.user && typeof c.user === 'object')
    .filter(c => c.status === 'pending');
  
  const approvedCollaborators = collaborators
    .filter(c => c && typeof c === 'object' && c.user && typeof c.user === 'object')
    .filter(c => c.status === 'approved');
  
  const rejectedCollaborators = collaborators
    .filter(c => c && typeof c === 'object' && c.user && typeof c.user === 'object')
    .filter(c => c.status === 'rejected');
  
  // Validate collaborators list
  if (Array.isArray(collaborators) && collaborators.some(c => !c || !c.user || typeof c.user !== 'object')) {
    console.warn('Some collaborators in the list have invalid structure', 
      collaborators.filter(c => !c || !c.user || typeof c.user !== 'object'));
  }
  
  // Show message if no collaborators
  if (!Array.isArray(collaborators) || collaborators.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chưa có cộng tác viên nào đăng ký.</p>
      </div>
    );
  }
  
  // Hiển thị thông báo cho người không có quyền admin khi có yêu cầu đang chờ phê duyệt
  const showRequestPendingMessage = pendingCollaborators.length > 0 && !hasAdminAccess && user;
  
  // Render a Facebook-style pending request card
  const renderPendingCollaboratorCard = (collaborator: Collaborator) => {
    // Make sure collaborator has proper structure
    if (!collaborator || !collaborator.user || typeof collaborator.user !== 'object') {
      console.error('Invalid collaborator structure:', collaborator);
      return null;
    }
    
    const { user: collaboratorUser, requestedAt } = collaborator;
    
    // Safety check to ensure _id exists
    if (!collaboratorUser._id) {
      console.error('Collaborator user missing _id:', collaboratorUser);
      return null;
    }
    
    return (
      <div key={collaboratorUser._id} className="border mb-2 border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="p-4 flex flex-col">
          {/* User info header */}
          <div className="flex items-start gap-3 mb-3">
            {collaboratorUser && collaboratorUser.avatar && collaboratorUser.avatar.url ? (
              <img 
                src={collaboratorUser.avatar.url} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-7 h-7 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {collaboratorUser.fullName || 'Người dùng không xác định'}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <RiTimeLine className="inline" />
                <span>Yêu cầu {formatDistanceToNow(new Date(requestedAt), { addSuffix: true, locale: vi })}</span>
              </p>
              {collaboratorUser.email && (
                <p className="text-xs text-gray-500 mt-1">{collaboratorUser.email}</p>
              )}
            </div>
          </div>
          
          {/* Description - only visible to admins */}
          {hasAdminAccess && (
            <div className="text-sm text-gray-600 mb-4">
              <p>Người dùng này muốn trở thành cộng tác viên cho sự kiện này.</p>
            </div>
          )}
          
          {/* Action buttons - only for admins */}
          {hasAdminAccess && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleApprove(collaboratorUser._id, collaboratorUser.fullName || 'Người dùng')}
                disabled={loading[collaboratorUser._id]}
                className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading[collaboratorUser._id] ? 'Đang xử lý...' : 'Chấp nhận'}
              </button>
              <button
                onClick={() => openRejectModal(collaboratorUser._id, collaboratorUser.fullName || 'Người dùng')}
                disabled={loading[collaboratorUser._id]}
                className="flex-1 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render an approved or rejected collaborator card
  const renderCollaboratorCard = (collaborator: Collaborator) => {
    // Safety check for collaborator structure
    if (!collaborator || !collaborator.user || typeof collaborator.user !== 'object') {
      console.error('Invalid collaborator structure:', collaborator);
      return null;
    }
    
    const { user: collaboratorUser, status, approvedAt, approvedBy, rejectionReason } = collaborator;
    
    // Safety check for collaborator user _id
    if (!collaboratorUser._id) {
      console.error('Collaborator user missing _id:', collaboratorUser);
      return null;
    }
    
    const isApproved = status === 'approved';
    const isRejected = status === 'rejected';
    
    return (
      <div key={collaboratorUser._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transition hover:shadow-md">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            {collaboratorUser && collaboratorUser.avatar && collaboratorUser.avatar.url ? (
              <img 
                src={collaboratorUser.avatar.url} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-7 h-7 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {collaboratorUser.fullName || 'Người dùng không xác định'}
              </p>
              <p className="text-xs text-gray-500">
                {isApproved && approvedAt && (
                  <span className="text-green-600">
                    Phê duyệt {formatDistanceToNow(new Date(approvedAt), { addSuffix: true, locale: vi })}
                    {approvedBy && approvedBy.fullName && ` bởi ${approvedBy.fullName}`}
                  </span>
                )}
                {isRejected && (
                  <span className="text-red-600">
                    {rejectionReason ? `Lý do từ chối: ${rejectionReason}` : 'Đã từ chối'}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Only show action buttons for admins/organizers */}
          {hasAdminAccess && (
            <div className="flex items-center">
              {isApproved && (
                <button
                  onClick={() => openDeleteModal(collaboratorUser._id, collaboratorUser.fullName || 'Người dùng')}
                  disabled={loading[collaboratorUser._id]}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-gray-50 rounded-full transition disabled:opacity-50"
                  title="Xóa cộng tác viên"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}
              
              {isRejected && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleApprove(collaboratorUser._id, collaboratorUser.fullName || 'Người dùng')}
                    disabled={loading[collaboratorUser._id]}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
                  >
                    Duyệt lại
                  </button>
                  <button
                    onClick={() => openDeleteModal(collaboratorUser._id, collaboratorUser.fullName || 'Người dùng')}
                    disabled={loading[collaboratorUser._id]}
                    className="p-1.5 border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                    title="Xóa khỏi danh sách"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Thông báo cho người dùng thông thường khi có yêu cầu đang chờ phê duyệt */}
      {/*showRequestPendingMessage && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-700">
          <p className="font-medium">Có {pendingCollaborators.length} yêu cầu đang chờ phê duyệt</p>
          <p>Chỉ người tạo sự kiện, người tổ chức và quản trị viên mới có quyền phê duyệt yêu cầu làm cộng tác viên.</p>
        </div>
      )}*/}
      
      {/* Pending requests section - Facebook style */}
      {pendingCollaborators.length > 0 && hasAdminAccess && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-lg text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
              Yêu cầu làm cộng tác viên ({pendingCollaborators.length})
              
              {/* Icon dấu hỏi cho creator và organizer */}
              {!loadingEventDetails && (isCreator || isOrganizer) && (
                <button 
                  onClick={() => setShowPermissionGuide(!showPermissionGuide)}
                  className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all hover:shadow-md relative group"
                  title="Thông tin về quyền phê duyệt"
                  aria-label="Hiển thị thông tin về quyền phê duyệt"
                >
                  <span className="text-xs font-bold">?</span>
                  
                  {/* Hiệu ứng gợi ý khi người dùng chưa từng click */}
                  {/*!showPermissionGuide && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                  )*/}
                  
                  {/* Tooltip hiển thị khi hover */}
                  <span 
                    className="fixed transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-[9999] shadow-lg border border-gray-700" 
                    style={{ bottom: 'calc(100% + 20px)', left: '50%', marginBottom: '15px' }}
                  >
                    Quyền phê duyệt
                  </span>
                </button>
              )}
            </h3>
            
            {/* Hiển thị trạng thái loading khi đang tải dữ liệu */}
            {loadingEventDetails ? (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-md text-sm text-gray-600 animate-pulse">
                <p className="font-medium">Đang tải thông tin sự kiện...</p>
              </div>
            ) : (
              /* Hướng dẫn cho creator và organizer */
              showPermissionGuide && (isCreator || isOrganizer) && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-700">
                  <div className="flex justify-between">
                    <p className="font-medium">Bạn có quyền phê duyệt yêu cầu làm cộng tác viên</p>
                    <button 
                      onClick={() => setShowPermissionGuide(false)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      &times;
                    </button>
                  </div>
                  <p>Với vai trò là <span className="font-bold">{isCreator ? 'Người tạo sự kiện' : 'Người tổ chức'}</span>, bạn có thể chấp nhận hoặc từ chối các yêu cầu làm cộng tác viên bên dưới.</p>
                  <p className="mt-1 text-xs">Sự kiện: {eventDetails?.title || currentEvent?.title || 'Đang tải...'}</p>
                </div>
              )
            )}
          </div>
          
          <div className="divide-y divide-gray-100">
            {pendingCollaborators.map(renderPendingCollaboratorCard)}
          </div>
        </div>
      )}
      
      {/* Approved collaborators section */}
      {approvedCollaborators.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Cộng tác viên đã duyệt ({approvedCollaborators.length})
          </h3>
          
          <div className="space-y-3">
            {approvedCollaborators.map(renderCollaboratorCard)}
          </div>
        </div>
      )}
      
      {/* Rejected collaborators section - only visible to admins */}
      {rejectedCollaborators.length > 0 && hasAdminAccess && (
        <div>
          <h3 className="font-semibold text-lg text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
            Yêu cầu đã từ chối ({rejectedCollaborators.length})
          </h3>
          
          <div className="space-y-3">
            {rejectedCollaborators.map(renderCollaboratorCard)}
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Từ chối yêu cầu làm CTV</h3>
            <p className="mb-4 text-sm text-gray-600">
              Từ chối yêu cầu của <span className="font-semibold">{selectedUserName}</span>. Vui lòng cung cấp lý do (không bắt buộc):
            </p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full border rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Lý do từ chối..."
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-4">Xóa cộng tác viên</h3>
            <p className="mb-4 text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa <span className="font-semibold">{selectedUserName}</span> khỏi danh sách cộng tác viên?
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaboratorsList; 