import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications, getSocketStatus } from '../context/NotificationContext';
import { useEvents } from '../context/EventContext';
import eventService from '../services/eventService';
import { toast } from 'react-toastify';
import { AxiosError } from 'axios';
import { RiUserAddLine, RiUserUnfollowLine, RiTimeLine, RiUserReceivedLine, RiCloseLine } from 'react-icons/ri';

// Interface for collaborators with status
interface CollaboratorWithStatus {
  user: {
    _id: string;
    fullName?: string;
  } | string;
  status?: string;
}

// Define a type for event collaborators to avoid 'any'
type EventCollaborator = string | {
  user: string | { _id: string };
  status?: string;
};

interface CollaborateEventButtonProps {
  eventId: string;
  collaborators?: Array<string | { _id: string, user?: string, status?: string }>;
  onJoinSuccess?: () => void;
  onLeaveSuccess?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  startDate?: Date | string;
  endDate?: Date | string;
  status?: string;
  // New prop for compact mode
  isCompact?: boolean;
}

const CollaborateEventButton: React.FC<CollaborateEventButtonProps> = ({
  eventId,
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
}) => {
  const { user } = useAuth();
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
    try {
      const response = await eventService.getEventCollaborators(eventId);
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
        
        if (userCollaborator) {
          setCollaboratorStatus(userCollaborator.status || 'pending');
        }
      }
    } catch (error) {
      console.error('Error fetching detailed collaborator status:', error);
    }
  };

  // Check collaborator status directly from API when component mounts
  useEffect(() => {
    if (!eventId || !user || !user._id) return;

    const checkCollaboratorStatus = async () => {
      setIsLoading(true);
      try {
        // Direct API call to get event details including collaborators
        const eventResponse = await eventService.getEventById(eventId);
        if (!eventResponse.success || !eventResponse.data) return;
        
        const event = eventResponse.data;
        
        // Check if user is in collaborators list
        if (event.collaborators && Array.isArray(event.collaborators)) {
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
          
          if (userCollaborator) {
            // User is a collaborator, set state
            setIsCollaborator(true);
            
            // Get status if available (might be in object form)
            if (typeof userCollaborator === 'object' && userCollaborator.status) {
              setCollaboratorStatus(userCollaborator.status);
            } else {
              // If no status info in event, fetch from collaborators endpoint
              await fetchDetailedStatus(user._id, eventId);
            }
          }
        }
      } catch (error) {
        console.error('Error checking collaborator status:', error);
        // Fallback to context-based check
        const isUserACollaborator = isUserCollaborator(eventId);
        setIsCollaborator(isUserACollaborator);
        
        if (isUserACollaborator && user._id) {
          await fetchDetailedStatus(user._id, eventId);
        }
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    
    checkCollaboratorStatus();
  }, [eventId, user, isUserCollaborator]);

  const handleJoinAsCollaborator = useCallback(async () => {
    if (!user || !eventId) return;
    
    try {
      setIsLoading(true);
      
      const response = await eventService.joinEventAsCollaborator(eventId);
      
      // Update local state
      setIsCollaborator(true);
      setCollaboratorStatus('pending');
      
      // Update global state if needed
      if (onJoinSuccess) {
        onJoinSuccess();
      }
      
      // Refresh the collaborator list to get the updated status
      await fetchCollaborators(eventId);
      
      // Show success message
      toast.success(response.message || 'Đã gửi yêu cầu làm cộng tác viên thành công');
      
      // Update notifications
      await updateNotifications();
      
    } catch (error) {
      if ((error as AxiosError).response?.status === 400) {
        // If we get an error that the user is already a collaborator, update the UI state accordingly
        setIsCollaborator(true);
        setCollaboratorStatus('pending'); 
        
        // Show error with the actual error message
        toast.error((error as AxiosError<{message: string, error?: string}>).response?.data?.message || 
                  (error as AxiosError<{message: string, error?: string}>).response?.data?.error || 
                  'Bạn đã đăng ký làm cộng tác viên rồi');
        
        // Refresh the collaborators list to get the correct status
        await fetchCollaborators(eventId);
      } else {
        toast.error('Có lỗi xảy ra khi đăng ký làm cộng tác viên');
        console.error('Error joining as collaborator:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, eventId, onJoinSuccess, fetchCollaborators]);

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
  }, [user, eventId, collaboratorStatus, showCancelConfirm, onLeaveSuccess, fetchCollaborators]);

  const updateNotifications = async () => {
    try {
      const socketStatus = getSocketStatus();
      console.log('Socket status:', socketStatus);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to update notifications:', error);
    }
  };

  // Check if event is active (not cancelled and not ended)
  const isEventActive = useCallback(() => {
    if (status === 'cancelled') return false;
    
    const now = new Date();
    const eventEnd = endDate ? new Date(endDate) : null;

    if (eventEnd && now > eventEnd) return false;
    
    return true;
  }, [endDate, status]);

  // If no user or event is inactive, don't show the button
  if (!user || !isEventActive()) {
    return null;
  }

  // If not initialized yet, show loading state
  if (!isInitialized) {
    return (
      <button 
        disabled
        className="relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-colors border border-gray-300 text-gray-400 bg-gray-50"
      >
        <span className="animate-pulse">Đang tải...</span>
      </button>
    );
  }

  // Handle the cancel confirmation dialog close
  const handleCancelConfirmClose = () => {
    setShowCancelConfirm(false);
  };

  // Determine button appearance based on status
  let buttonText = isCollaborator ? 'Hủy CTV' : 'Đăng ký CTV';
  let buttonIcon = isCollaborator ? <RiUserUnfollowLine /> : <RiUserAddLine />;
  let buttonClass = isCollaborator
    ? 'border border-red-500 text-red-500 hover:bg-red-50'
    : 'border border-blue-500 text-blue-500 hover:bg-blue-50';
  const isButtonDisabled = isLoading;
  
  // Adjust based on approval status
  if (isCollaborator && collaboratorStatus) {
    if (collaboratorStatus === 'pending') {
      buttonText = 'Đang chờ duyệt';
      buttonIcon = <RiTimeLine />;
      buttonClass = 'border border-amber-500 text-amber-500 hover:bg-amber-50';
      // Don't disable the button - allow cancellation
    } else if (collaboratorStatus === 'approved') {
      buttonText = 'Đã là CTV';
      buttonIcon = <RiUserReceivedLine />;
      buttonClass = 'border border-green-500 text-green-500 hover:bg-green-50';
    } else if (collaboratorStatus === 'rejected') {
      buttonText = 'Đã bị từ chối';
      buttonClass = 'border border-gray-500 text-gray-500 hover:bg-gray-50';
    }
  }

  // Show confirmation dialog for canceling a pending request
  if (showCancelConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Hủy yêu cầu?</span>
        <button
          onClick={handleLeaveAsCollaborator}
          disabled={isLoading}
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50"
        >
          <RiCloseLine />
        </button>
        <button
          onClick={handleCancelConfirmClose}
          className="p-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
        >
          <RiCloseLine />
        </button>
      </div>
    );
  }
  
  // Show compact or full version based on props or screen size
  return (
    <button
      onClick={isCollaborator ? handleLeaveAsCollaborator : handleJoinAsCollaborator}
      disabled={isButtonDisabled}
      className={`relative flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg transition-colors ${buttonClass} ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={showCompact ? buttonText : undefined}
    >
      {collaboratorStatus === 'pending' && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
      )}
      {buttonIcon}
      {!showCompact && <span>{buttonText}</span>}
    </button>
  );
};

export default CollaborateEventButton; 