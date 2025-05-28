import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications, getSocketStatus } from '../context/NotificationContext';
import { useEvents } from '../context/EventContext';
import { CollaboratorWithStatus } from '../types';
import eventService from '../services/eventService';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { RiUserAddLine, RiUserUnfollowLine, RiTimeLine, RiUserReceivedLine, RiCloseLine } from 'react-icons/ri';
import CollaboratorScheduleModal from './modals/CollaboratorScheduleModal';

// Cache for event existence checks to prevent repeated 404 calls
const eventExistenceCache = new Map<string, boolean>();
const API_CALL_DEBOUNCE_TIME = 200; // ms

// Define a type for event collaborators to avoid 'any'
type EventCollaborator = string | {
  user: string | { _id: string };
  status?: string;
};

interface CollaborateEventButtonProps {
  eventId: string;
  eventTitle?: string;
  collaborators?: Array<string | { _id: string, user?: string, status?: string }>;
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startDate?: Date | string;
  endDate?: Date | string;
  status?: string;
  // New prop for compact mode
  isCompact?: boolean;
  // Add organizer and creator ids for checking
  organizerId?: string;
  creatorId?: string;
  // Add prop to indicate if event exists to prevent unnecessary API calls
  eventExists?: boolean;
  // Thêm thông tin về thời gian setup sự kiện
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
  // We're not using collaborators prop anymore since we rely on context
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collaborators,
  onJoinSuccess,
  onLeaveSuccess,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startDate,
  endDate,
  status,
  // Default to auto-responsive mode if not specified
  isCompact,
  // Event owner props
  organizerId,
  creatorId,
  // Event existence check
  eventExists = true, // Default to true for backward compatibility
  setupTime,
}) => {  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const { isUserCollaborator, fetchCollaborators } = useEvents();
  const [isLoading, setIsLoading] = useState(false);
  // Use local state to prevent unnecessary re-renders
  const [isCollaborator, setIsCollaborator] = useState(false);
  // Status tracking for approval status
  const [collaboratorStatus, setCollaboratorStatus] = useState<string | null>(null);
  // State to track screen width for responsive design
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  // State to control cancel confirmation
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  // Track initialization to prevent flickering
  const [isInitialized, setIsInitialized] = useState(false);
  // State to control schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [availableDays, setAvailableDays] = useState([]);
  
  // Ref to track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Cleanup ref on unmount
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
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Determine if showing compact version (explicit prop or auto based on screen width)
  const showCompact = isCompact !== undefined 
    ? isCompact 
    : windowWidth < 640; // sm breakpoint in Tailwind
  // Helper function to fetch detailed collaborator status
  const fetchDetailedStatus = async (userId: string, eventId: string) => {
    if (!isMountedRef.current) return;
    
    try {
      const response = await eventService.getEventCollaborators(eventId);
      
      if (!isMountedRef.current) return;
      
      const collaboratorsList = response.data as CollaboratorWithStatus[];
      
      if (collaboratorsList && collaboratorsList.length > 0) {
        // Find the user in the collaborators list
        const userCollaborator = collaboratorsList.find(collab => {
          if (typeof collab.user === 'string') {
            return collab.user === userId;
          } else if (collab.user) {
            return collab.user._id === userId;
          }
          return false;
        });
        
        if (userCollaborator && isMountedRef.current) {
          setCollaboratorStatus(userCollaborator.status || 'pending');
        }
      }
    } catch (error) {
      // Silently handle 403/404 errors to reduce console spam
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 403 || axiosError.response?.status === 404) {
          return;
        }
      }
      console.error('Error fetching detailed collaborator status:', error);
    }
  };

  const updateNotifications = async () => {
    try {
      // Check socket status
      const socketStatus = getSocketStatus();
      console.log('Socket status:', socketStatus);
      
      // Give the backend time to create notifications
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Try fetching notifications multiple times with delay between attempts
      for (let attempt = 0; attempt < 3; attempt++) {
        await fetchNotifications();
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  // Check if user is organizer or creator of the event
  const isOrganizer = user?._id === organizerId;
  const isCreator = user?._id === creatorId;
  const hasFullAccess = user?.role === 'admin' || user?.role === 'superadmin' || 
                       user?.role === 'department_admin' || user?.role === 'department_head';  // Check collaborator status directly from API when component mounts
  useEffect(() => {
    if (!eventId || !user || !user._id || !isMountedRef.current) return;

    // Skip check if event doesn't exist to prevent 404 errors
    if (!eventExists) {
      setIsInitialized(true);
      return;
    }

    // Check cache first for known non-existent events
    const cachedExists = eventExistenceCache.get(eventId);
    if (cachedExists === false) {
      setIsInitialized(true);
      return;
    }

    // Skip check if user is organizer or creator
    if (isOrganizer || isCreator) {
      setIsInitialized(true);
      return;
    }

    const checkCollaboratorStatus = async () => {
      if (!isMountedRef.current) return;
      
      setIsLoading(true);
      
      // Add debounce delay to batch similar requests and avoid spam
      await new Promise(resolve => setTimeout(resolve, API_CALL_DEBOUNCE_TIME));
      
      if (!isMountedRef.current) return;
      
      try {
        // First try context-based check to avoid API call if possible
        const isUserACollaborator = isUserCollaborator(eventId);
        
        if (isUserACollaborator) {
          // User is already known to be a collaborator from context
          if (isMountedRef.current) {
            setIsCollaborator(true);
            
            // Only fetch detailed status if needed
            if (user._id) {
              await fetchDetailedStatus(user._id, eventId);
            }
          }
        } else {
          // Only make API call if context doesn't have the info and eventId looks valid
          // Basic validation to prevent calls for obviously invalid IDs
          if (eventId.length === 24 && /^[0-9a-fA-F]{24}$/.test(eventId)) {
            // Direct API call to get event details including collaborators
            const eventResponse = await eventService.getEventById(eventId);
            
            // Handle error responses gracefully
            if (!eventResponse.success || !eventResponse.data) {
              if (eventResponse.error === 'Event not found') {
                // Cache that this event doesn't exist to prevent future API calls
                eventExistenceCache.set(eventId, false);
                return;
              }
              return;
            }
            
            // Cache that this event exists
            eventExistenceCache.set(eventId, true);
            
            const event = eventResponse.data;
            
            // Check if user is in collaborators list
            if (event.collaborators && Array.isArray(event.collaborators) && isMountedRef.current) {
              const userCollaborator = event.collaborators.find((collab: EventCollaborator) => {
                // Handle different collaborator formats
                if (typeof collab === 'string') {
                  return collab === user._id;
                } else if (collab.user) {
                  const userId = typeof collab.user === 'string' ? collab.user : collab.user._id;
                  return userId === user._id;
                }
                return false;
              });
              
              if (userCollaborator && isMountedRef.current) {
                // User is a collaborator, set state
                setIsCollaborator(true);
                
                // Get status if available (might be in object form)
                if (typeof userCollaborator === 'object' && userCollaborator.status) {
                  setCollaboratorStatus(userCollaborator.status);
                } else {
                  // If no status info in event, fetch from collaborators endpoint
                  if (user._id) {
                    await fetchDetailedStatus(user._id, eventId);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        // Silently handle 404 errors to reduce console spam
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any;
          if (axiosError.response?.status === 404) {
            // Cache that this event doesn't exist
            eventExistenceCache.set(eventId, false);
            return;
          }
        }
        
        console.error('Error checking collaborator status:', error);
        
        // Fallback to context-based check only if it's not a 404
        if (isMountedRef.current) {
          const isUserACollaborator = isUserCollaborator(eventId);
          setIsCollaborator(isUserACollaborator);
          
          if (isUserACollaborator && user._id) {
            await fetchDetailedStatus(user._id, eventId);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };
    
    checkCollaboratorStatus();
  }, [eventId, user, isUserCollaborator, isOrganizer, isCreator, eventExists]);

  // Helper function to extract available support days from setupTime
  const extractAvailableDays = (setupTime: any) => {
    if (setupTime?.supportDays && Array.isArray(setupTime.supportDays)) {
      return setupTime.supportDays.map((day: any) => ({
        date: day.date,
        sessions: day.sessions || []
      }));
    }
    return [];
  };

  useEffect(() => {
    if (setupTime) {
      setAvailableDays(extractAvailableDays(setupTime));
    }
  }, [setupTime]);

  const handleJoinAsCollaborator = useCallback(() => {
    if (!user || !eventId) return;
    
    // Mở modal để chọn lịch làm việc
    setShowScheduleModal(true);
  }, [user, eventId]);

  const handleScheduleSubmitSuccess = useCallback(async () => {
    try {
      setIsCollaborator(true);
      setCollaboratorStatus('pending');
      await updateNotifications();
      
      toast.success('Đăng ký làm cộng tác viên thành công! Vui lòng chờ phê duyệt.');
      setShowScheduleModal(false);
      
      if (onJoinSuccess) {
        onJoinSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đăng ký làm cộng tác viên');
    }
  }, [updateNotifications, onJoinSuccess]);

  const handleLeaveAsCollaborator = useCallback(async () => {
    if (!user || !eventId) return;
    
    // If user is in pending status, show confirmation before canceling
    if (collaboratorStatus === 'pending' && !showCancelConfirm) {
      setShowCancelConfirm(true);
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await eventService.leaveEventAsCollaborator(eventId);
      
      // Update local state
      setIsCollaborator(false);
      setCollaboratorStatus(null);
      setShowCancelConfirm(false);
      
      // Update global state if needed
      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
      
      // Refresh the collaborator list
      await fetchCollaborators(eventId);
      
      // Show success message
      toast.success(response.message || 'Đã hủy đăng ký làm cộng tác viên');
      
      // Update notifications
      await updateNotifications();
      
    } catch (error) {
      toast.error('Có lỗi xảy ra khi hủy đăng ký làm cộng tác viên');
      console.error('Error leaving as collaborator:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, eventId, collaboratorStatus, showCancelConfirm, onLeaveSuccess, fetchCollaborators, updateNotifications]);

  // Check if event is active (not cancelled and not ended)
  const isEventActive = useCallback(() => {
    if (status === 'cancelled') return false;
    
    const now = new Date();
    const eventEnd = endDate ? new Date(endDate) : null;

    if (eventEnd && now > eventEnd) return false;
    
    return true;
  }, [endDate, status]);

  // Don't show button if:
  // 1. No user is logged in
  // 2. Event is inactive (cancelled or ended)
  // 3. User is the event organizer or creator
  if (!user || !isEventActive() || isOrganizer || isCreator) {
    return null;
  }

  // If not initialized yet, show loading state
  if (!isInitialized) {
    return (
      <div className="inline-block relative">
        <button 
          disabled
          className="transition-colors px-5 py-2 rounded-xl font-medium bg-gray-200 text-gray-400 cursor-not-allowed"
        >
          <span className="animate-pulse">Đang tải...</span>
        </button>
      </div>
    );
  }

  // Handle the cancel confirmation dialog close
  const handleCancelConfirmClose = () => {
    setShowCancelConfirm(false);
  };

  // Render button text based on collaborator status
  const renderButtonText = () => {
    // If loading, show loading text
    if (isLoading) {
      return showCompact ? 'Đang xử lý...' : 'Đang xử lý yêu cầu...';
    }
    
    // User is a collaborator - show appropriate status text
    if (isCollaborator) {
      // Handle different statuses
      if (collaboratorStatus === 'pending') {
        return showCompact ? 'Chờ duyệt' : 'Đang chờ phê duyệt';
      } else if (collaboratorStatus === 'approved') {
        return showCancelConfirm 
          ? (showCompact ? 'Xác nhận hủy?' : 'Xác nhận hủy đăng ký?')
          : (showCompact ? 'Đã là CTV' : 'Bạn đã là CTV');
      } else if (collaboratorStatus === 'rejected') {
        return showCompact ? 'Đã từ chối' : 'Yêu cầu đã bị từ chối';
      }
      
      // Default collaborator text
      return showCompact ? 'Đã là CTV' : 'Bạn đã là CTV';
    }
    
    // User is not a collaborator yet
    return showCompact ? 'Đăng ký CTV' : 'Đăng ký làm CTV';
  };

  // Determine button appearance based on status
  let buttonText = renderButtonText();
  let buttonIcon = isCollaborator ? <RiUserUnfollowLine className="h-5 w-5" /> : <RiUserAddLine className="h-5 w-5" />;
  let buttonClass = '';
  const isButtonDisabled = isLoading;
  
  // Adjust based on approval status
  if (isCollaborator && collaboratorStatus) {
    if (collaboratorStatus === 'pending') {
      buttonClass = 'border-2 border-amber-500 text-amber-500 hover:bg-amber-50';
    } else if (collaboratorStatus === 'approved') {
      buttonClass = 'border-2 border-green-600 text-green-600 hover:bg-green-50';
    } else if (collaboratorStatus === 'rejected') {
      buttonClass = 'border-2 border-gray-500 text-gray-500 hover:bg-gray-50';
    } else {
      buttonClass = 'border-2 border-red-600 text-red-600 hover:bg-red-50';
    }
  } else {
    buttonClass = 'bg-blue-600 text-white hover:bg-blue-700';
  }
  
  // Show compact or full version based on props or screen size
  return (
    <>
      <div className="inline-block relative group">
        <button
          onClick={isCollaborator ? handleLeaveAsCollaborator : handleJoinAsCollaborator}
          disabled={isButtonDisabled}
          title={buttonText}
          aria-label={buttonText}
          className={`transition-colors ${
            showCompact 
              ? `p-2 rounded-full flex items-center justify-center ${buttonClass}`
              : `px-5 py-2 rounded-xl font-medium ${buttonClass}`
          } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {showCompact ? (
            isLoading ? (
              <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              buttonIcon
            )
          ) : (
            isLoading 
              ? 'Đang xử lý...'
              : buttonText
          )}
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