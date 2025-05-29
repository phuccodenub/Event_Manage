import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useEvents } from '../context/EventContext';
import { CollaboratorWithStatus } from '../types';
import eventService from '../services/eventService';
import { toast } from 'react-toastify';
import { RiUserAddLine, RiTimeLine } from 'react-icons/ri';
import CollaboratorScheduleModal from './modals/CollaboratorScheduleModal';

interface CollaborateEventButtonProps {
  eventId: string;
  eventTitle?: string;
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
  endDate?: Date | string;
  status?: string;
  isCompact?: boolean;
  organizerId?: string;
  creatorId?: string;
  eventExists?: boolean;
  setupTime?: {
    supportDays?: Array<{
      date: string | Date;
      sessions: Array<{
        type: string;
        startTime: string;
        endTime: string;
        label: string;
      }>;
    }>;
  };
}

const CollaborateEventButton: React.FC<CollaborateEventButtonProps> = ({
  eventId,
  eventTitle = "Sự kiện",
  onJoinSuccess,
  endDate,
  status,
  isCompact,
  organizerId,
  creatorId,
  setupTime,
}) => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const { isUserCollaborator, fetchCollaborators } = useEvents();
  
  // Chỉ cần 2 state đơn giản
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [collaboratorStatus, setCollaboratorStatus] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Update window width when resized
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if showing compact version
  const showCompact = isCompact !== undefined ? isCompact : windowWidth < 640;

  // Check if user is organizer or creator
  const isOrganizer = user?._id === organizerId;
  const isCreator = user?._id === creatorId;
  const hasFullAccess = user?.role === 'admin' || user?.role === 'superadmin' || 
                       user?.role === 'department_admin' || user?.role === 'department_head';

  // Check collaborator status when component mounts
  useEffect(() => {
    if (!eventId || !user || !user._id || !isMountedRef.current) return;
    if (isOrganizer || isCreator) return;

    const checkStatus = async () => {
      try {
        // Check from context first
        const isUserACollaborator = isUserCollaborator(eventId);
        if (isUserACollaborator) {
          setIsCollaborator(true);
          // Get detailed status
          const response = await eventService.getEventCollaborators(eventId);
          const collaboratorsList = response.data as CollaboratorWithStatus[];
          const userCollaborator = collaboratorsList.find(collab => {
            if (typeof collab.user === 'string') {
              return collab.user === user._id;
            } else if (collab.user) {
              return collab.user._id === user._id;
            }
            return false;
          });
          
          if (userCollaborator && isMountedRef.current) {
            setCollaboratorStatus(userCollaborator.status || 'pending');
          }
        }
      } catch (error) {
        // Silently handle errors
        console.error('Error checking collaborator status:', error);
      }
    };

    checkStatus();
  }, [eventId, user, isUserCollaborator, isOrganizer, isCreator]);

  const handleJoinAsCollaborator = useCallback(async () => {
    if (!user || !eventId) return;
    
    // Nếu có setupTime thì mở modal để chọn lịch
    if (setupTime?.supportDays && setupTime.supportDays.length > 0) {
      setShowScheduleModal(true);
    } else {
      // Join trực tiếp
      try {
        await eventService.joinEventAsCollaborator(eventId, {
          selectedShifts: [],
          formData: {}
        });
        
        // Cập nhật state ngay lập tức
        setIsCollaborator(true);
        setCollaboratorStatus('pending');
        
        // Update notifications
        try {
          await fetchNotifications();
        } catch (notificationError) {
          console.error('Failed to update notifications:', notificationError);
        }
        
        toast.success('Đăng ký làm cộng tác viên thành công! Vui lòng chờ phê duyệt.');
        
        if (onJoinSuccess) {
          onJoinSuccess();
        }
      } catch (error: any) {
        console.error('Error joining as collaborator:', error);
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký làm cộng tác viên');
      }
    }
  }, [user, eventId, setupTime, fetchNotifications, onJoinSuccess]);

  const handleScheduleSubmitSuccess = useCallback(async () => {
    setIsCollaborator(true);
    setCollaboratorStatus('pending');
    setShowScheduleModal(false);
    
    try {
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
    
    toast.success('Đăng ký làm cộng tác viên thành công! Vui lòng chờ phê duyệt.');
    
    if (onJoinSuccess) {
      onJoinSuccess();
    }
  }, [fetchNotifications, onJoinSuccess]);

  // Check if event is active
  const isEventActive = useCallback(() => {
    if (status === 'cancelled') return false;
    const now = new Date();
    const eventEnd = endDate ? new Date(endDate) : null;
    if (eventEnd && now > eventEnd) return false;
    return true;
  }, [endDate, status]);

  // Don't show button if user is not logged in, event is inactive, or user is organizer/creator
  if (!user || !isEventActive() || isOrganizer || isCreator) {
    return null;
  }

  // Render button text and style based on status
  let buttonText = '';
  let buttonIcon = <RiUserAddLine className="h-5 w-5" />;
  let buttonClass = '';
  let isDisabled = false;

  if (isCollaborator) {
    if (collaboratorStatus === 'pending') {
      buttonText = showCompact ? 'Chờ duyệt' : 'Chờ phê duyệt';
      buttonIcon = <RiTimeLine className="h-5 w-5" />;
      buttonClass = 'border-2 border-amber-500 text-amber-500 bg-amber-50';
      isDisabled = true;
    } else if (collaboratorStatus === 'approved') {
      buttonText = showCompact ? 'Đã duyệt' : 'Đã được phê duyệt';
      buttonIcon = <RiTimeLine className="h-5 w-5" />;
      buttonClass = 'border-2 border-green-600 text-green-600 bg-green-50';
      isDisabled = true;
    } else if (collaboratorStatus === 'rejected') {
      buttonText = showCompact ? 'Đã từ chối' : 'Yêu cầu đã bị từ chối';
      buttonClass = 'border-2 border-gray-500 text-gray-500 bg-gray-50';
      isDisabled = true;
    } else {
      buttonText = showCompact ? 'Đã đăng ký' : 'Đã đăng ký làm CTV';
      buttonClass = 'border-2 border-blue-600 text-blue-600 bg-blue-50';
      isDisabled = true;
    }
  } else {
    buttonText = showCompact ? 'Đăng ký CTV' : 'Đăng ký làm CTV';
    buttonClass = 'bg-blue-600 text-white hover:bg-blue-700';
  }

  return (
    <>
      <div className="inline-block relative group">
        <button
          onClick={handleJoinAsCollaborator}
          disabled={isDisabled}
          title={buttonText}
          aria-label={buttonText}
          className={`transition-colors ${
            showCompact 
              ? `p-2 rounded-full flex items-center justify-center ${buttonClass}`
              : `px-5 py-2 rounded-xl font-medium ${buttonClass}`
          } ${isDisabled ? 'cursor-not-allowed' : ''}`}
        >
          {showCompact ? buttonIcon : buttonText}
        </button>

        {showCompact && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-10">
            {buttonText}
          </div>
        )}
      </div>

      {showScheduleModal && (
        <CollaboratorScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          eventId={eventId}
          eventTitle={eventTitle}
          setupTime={setupTime}
          onSuccess={handleScheduleSubmitSuccess}
        />
      )}
    </>
  );
};

export default CollaborateEventButton; 